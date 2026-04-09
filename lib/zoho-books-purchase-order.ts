import { getAccessToken } from '@/lib/zoho'
import { amountToWordsIntegerOnly } from '@/lib/amount-words'
import {
  DEFAULT_PURCHASE_ORDER_VIEW,
  type PurchaseOrderViewModel,
} from '@/lib/purchase-order-view-model'
import {
  accountsOAuthBaseFromApiRoot,
  apiConsoleBaseFromApiRoot,
} from '@/lib/zoho-regional-urls'
import { getZohoOrganizationId } from '@/lib/zoho-org-id'

const DEFAULT_BOOKS_ROOT = 'https://www.zohoapis.com/books/v3'

function booksApiRoot(): string {
  const raw = process.env.ZOHO_BOOKS_API_ROOT?.trim()
  if (raw) return raw.replace(/\/$/, '')
  return DEFAULT_BOOKS_ROOT
}

function buyerCompanyName(): string {
  return process.env.PO_BUYER_COMPANY_NAME?.trim() || DEFAULT_PURCHASE_ORDER_VIEW.header.companyName
}

interface ZohoAddr {
  address?: string
  address1?: string
  address2?: string
  street2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  fax?: string
  attention?: string
  phone?: string
  email?: string
}

interface ZohoLineItem {
  item_id?: string
  line_item_id?: string
  sku?: string
  name?: string
  description?: string
  unit?: string
  quantity?: number
  rate?: number
  item_total?: number
  item_total_inclusive_of_tax?: number
  item_order?: number
}

interface ZohoContactPerson {
  contact_person_name?: string
  first_name?: string
  last_name?: string
  contact_person_email?: string
  phone?: string
  mobile?: string
}

interface ZohoCustomFieldRow {
  api_name?: string
  value?: string | number
  value_formatted?: string
}

/** Normalized shape consumed by {@link mapZohoPurchaseOrderPayload} (Books or Inventory). */
export interface ZohoPurchaseOrderPayload {
  purchaseorder_id?: string
  purchaseorder_number?: string
  date?: string
  reference_number?: string
  vendor_name?: string
  gst_no?: string
  currency_code?: string
  sub_total?: number
  total?: number
  tax_total?: number
  notes?: string
  terms?: string
  ship_via?: string
  is_inclusive_tax?: boolean
  price_precision?: number
  line_items?: ZohoLineItem[]
  billing_address?: ZohoAddr
  delivery_address?: ZohoAddr
  contact_persons_associated?: ZohoContactPerson[]
  custom_fields?: ZohoCustomFieldRow[]
  custom_field_hash?: Record<string, string | number | boolean | null | undefined>
}

/** Top-level Books / Inventory JSON (both use code, message). */
export interface ZohoPoApiJson {
  code: number
  message?: string
  purchaseorder?: ZohoPurchaseOrderPayload
  purchase_order?: Record<string, unknown>
}

export function parseZohoJsonBody(text: string): ZohoPoApiJson | null {
  try {
    return JSON.parse(text) as ZohoPoApiJson
  } catch {
    return null
  }
}

function formatPoDate(iso: string | undefined, fallback: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fallback
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function formatMoney(n: number | undefined, precision: number): string {
  if (n === undefined || Number.isNaN(n)) return '0.' + '0'.repeat(precision)
  return n.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

function addressToLines(addr: ZohoAddr | undefined): string[] {
  if (!addr) return []
  const lines: string[] = []
  const line1 = addr.address1 || addr.address
  if (line1) lines.push(line1)
  const line2 = addr.address2 || addr.street2
  if (line2) lines.push(line2)
  const zipStr = addr.zip !== undefined && addr.zip !== null ? String(addr.zip).trim() : ''
  const cityLine = [addr.city, addr.state, zipStr].filter(Boolean).join(', ')
  if (cityLine) lines.push(cityLine)
  if (addr.country) lines.push(addr.country)
  return lines.length ? lines : []
}

function customFieldString(
  po: ZohoPurchaseOrderPayload,
  apiName: string,
): string | undefined {
  const hash = po.custom_field_hash
  if (hash && hash[apiName] != null && hash[apiName] !== '') {
    const v = hash[apiName]
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    return String(v)
  }
  const row = po.custom_fields?.find((f) => f.api_name === apiName)
  if (row) {
    const raw = row.value_formatted ?? row.value
    if (raw === undefined || raw === null || raw === '') return undefined
    return String(raw)
  }
  return undefined
}

/** Keep standard JBF remarks; append Zoho notes/terms after them (continued numbering). */
function appendZohoRemarksToDefaults(
  defaultRemarks: string[],
  po: ZohoPurchaseOrderPayload,
): string[] {
  const out = [...defaultRemarks]
  let n = out.length + 1
  const pushBlock = (label: string, text: string | undefined) => {
    if (!text?.trim()) return
    for (const line of text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
      out.push(`${n} ${label}: ${line}`)
      n += 1
    }
  }
  pushBlock('NOTE', po.notes)
  pushBlock('TERMS', po.terms)
  if (po.reference_number) {
    out.push(`${n} REFERENCE: ${po.reference_number}`)
    n += 1
  }
  if (po.ship_via) {
    out.push(`${n} SHIP VIA: ${po.ship_via}`)
  }
  return out
}

function mapLineItems(
  items: ZohoLineItem[] | undefined,
  precision: number,
  isInclusiveTax: boolean,
): PurchaseOrderViewModel['lineItems'] {
  if (!items?.length) {
    return DEFAULT_PURCHASE_ORDER_VIEW.lineItems
  }
  const sorted = [...items].sort(
    (a, b) => (a.item_order ?? 0) - (b.item_order ?? 0),
  )
  return sorted.map((row, idx) => {
    const qty = row.quantity ?? 0
    const rate = row.rate ?? 0
    const gross = isInclusiveTax
      ? row.item_total_inclusive_of_tax ?? row.item_total ?? rate * qty
      : rate * qty
    const net = row.item_total ?? row.item_total_inclusive_of_tax ?? gross
    const descParts = [row.name, row.description].filter(Boolean)
    const description = descParts.join(' — ') || '—'
    return {
      srNo: idx + 1,
      itemCode: (row.sku || row.item_id || '').toString() || '—',
      description,
      uom: row.unit || '—',
      quantity: formatMoney(qty, precision),
      unitPrice: formatMoney(rate, precision),
      grossValue: formatMoney(
        typeof gross === 'number' && !Number.isNaN(gross) ? gross : net,
        precision,
      ),
      netValue: formatMoney(net, precision),
    }
  })
}

export function mapZohoPurchaseOrderPayload(po: ZohoPurchaseOrderPayload): PurchaseOrderViewModel {
  const vm = structuredClone(DEFAULT_PURCHASE_ORDER_VIEW)
  const precision =
    typeof po.price_precision === 'number' && po.price_precision >= 0
      ? po.price_precision
      : 3
  const currency = po.currency_code || vm.shipTo.currency

  vm.header.companyName = buyerCompanyName()
  vm.header.poNumber = po.purchaseorder_number || vm.header.poNumber
  vm.header.poDate = formatPoDate(po.date, vm.header.poDate)

  vm.supplier.name = po.vendor_name || vm.supplier.name
  const trnNo = customFieldString(po, 'cf_trn_no')
  if (trnNo) vm.supplier.trn = trnNo
  else if (po.gst_no) vm.supplier.trn = po.gst_no
  else if (po.vendor_name) vm.supplier.trn = ''
  const primaryContact = po.contact_persons_associated?.[0]
  if (primaryContact) {
    const name =
      primaryContact.contact_person_name ||
      [primaryContact.first_name, primaryContact.last_name].filter(Boolean).join(' ')
    if (name) vm.supplier.contact = name
    if (primaryContact.contact_person_email) vm.supplier.email = primaryContact.contact_person_email
    const ph = primaryContact.phone || primaryContact.mobile
    if (ph) vm.supplier.phone = ph
  }
  if (po.ship_via) vm.supplier.deliveryTerms = po.ship_via
  if (po.terms?.trim()) vm.supplier.paymentTerms = po.terms.trim()

  const trnNo1 = customFieldString(po, 'cf_trn_no1')
  const trnNo2 = customFieldString(po, 'cf_trn_no2')
  const countryOfOrigin = customFieldString(po, 'cf_country_of_origin')
  const portOfLoading = customFieldString(po, 'cf_port_of_loading')
  const countryOfDest =
    customFieldString(po, 'cf_country_of_final_destination') ??
    customFieldString(po, 'cf_final_destination')
  const portOfDischarge = customFieldString(po, 'cf_post_of_discharge')

  const billLines = addressToLines(po.billing_address)
  if (billLines.length) {
    vm.billTo.addressLines = billLines
    const att = po.billing_address?.attention
    if (att) vm.billTo.name = att
    vm.billTo.trn = trnNo1 ?? ''
    vm.billTo.phone = po.billing_address?.phone?.trim() ? po.billing_address.phone : ''
    vm.billTo.fax = po.billing_address?.fax?.trim() ? po.billing_address.fax : ''
  } else if (trnNo1) {
    vm.billTo.trn = trnNo1
  }
  if (countryOfOrigin) vm.billTo.countryOfOrigin = countryOfOrigin
  if (portOfLoading) vm.billTo.portOfLoading = portOfLoading

  const ship = po.delivery_address
  const shipLines = addressToLines(ship)
  if (shipLines.length) {
    vm.shipTo.addressLines = shipLines
    vm.shipTo.name = ship?.attention || buyerCompanyName()
    vm.shipTo.phone = ship?.phone?.trim() ? ship.phone : ''
    if (trnNo2) vm.shipTo.trn = trnNo2
  } else if (trnNo2) {
    vm.shipTo.trn = trnNo2
  }
  if (countryOfDest) vm.shipTo.countryOfDestination = countryOfDest
  if (portOfDischarge) vm.shipTo.portOfDischarge = portOfDischarge
  vm.shipTo.currency = currency

  vm.lineItems = mapLineItems(po.line_items, precision, po.is_inclusive_tax === true)

  const sub = po.sub_total ?? 0
  const tot = po.total ?? sub
  vm.totals.subTotal = formatMoney(sub, precision)
  vm.totals.totalAmount = formatMoney(tot, precision)
  vm.totals.amountInWords = amountToWordsIntegerOnly(tot, currency)

  vm.remarks = appendZohoRemarksToDefaults(DEFAULT_PURCHASE_ORDER_VIEW.remarks, po)
  vm.footer.company = vm.header.companyName

  return vm
}

export class PurchaseOrderFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly zohoApiCode?: number,
  ) {
    super(message)
    this.name = 'PurchaseOrderFetchError'
  }

  /** Typical when OAuth scopes omit Books, wrong DC, or wrong org. */
  get isLikelyAuthorizationOrScopeIssue(): boolean {
    const m = this.message.toLowerCase()
    return (
      m.includes('not authorized') ||
      m.includes('unauthorized') ||
      m.includes('invalid oauth') ||
      (m.includes('oauth') && m.includes('scope')) ||
      this.zohoApiCode === 57 ||
      this.zohoApiCode === 401
    )
  }
}

export function formatZohoBooksFailure(
  res: Response,
  json: ZohoPoApiJson | null,
  fallbackBody: string,
): PurchaseOrderFetchError {
  const zohoCode = json?.code
  const msg =
    json?.message?.trim() ||
    (fallbackBody.slice(0, 200) || `HTTP ${res.status} ${res.statusText}`)
  const suffix =
    zohoCode !== undefined && zohoCode !== null ? ` (Zoho API code ${zohoCode})` : ''
  return new PurchaseOrderFetchError(`${msg}${suffix}`, res.status, zohoCode)
}

/** Comma-separated scopes for the browser consent URL (PO read + org/settings read for org id). */
export const ZOHO_BOOKS_OAUTH_SCOPES_RECOMMENDED =
  'ZohoBooks.purchaseorders.READ,ZohoBooks.settings.READ'

/** Single scope if you only need PO lines (org id is copied from the Books UI). */
export const ZOHO_BOOKS_OAUTH_SCOPES_PO_ONLY = 'ZohoBooks.purchaseorders.READ'

/** Broad access for local testing only; prefer RECOMMENDED in production. */
export const ZOHO_BOOKS_OAUTH_SCOPES_FULLACCESS_ALL = 'ZohoBooks.fullaccess.all'

export function getConfiguredZohoBooksApiRoot(): string {
  return booksApiRoot()
}

/** Matches OAuth / console to Books API data center. */
export function getZohoAccountsOAuthBaseUrl(): string {
  return accountsOAuthBaseFromApiRoot(booksApiRoot())
}

export function getZohoApiConsoleBaseUrl(): string {
  return apiConsoleBaseFromApiRoot(booksApiRoot())
}

/**
 * Loads a Zoho Books purchase order by ID (same OAuth as zoho-token).
 * Requires `ZOHO_BOOKS_ORGANIZATION_ID` in the environment.
 */
export interface PurchaseOrderZohoApiFetchResult {
  viewModel: PurchaseOrderViewModel
  /** Full parsed JSON from `GET …/purchaseorders/{id}` (Books: `purchaseorder`; Inventory: `purchase_order`). */
  zohoApiResponse: ZohoPoApiJson
}

export async function fetchPurchaseOrderFromZohoBooks(
  purchaseorderId: string,
): Promise<PurchaseOrderZohoApiFetchResult> {
  const orgId = getZohoOrganizationId()
  if (!orgId) {
    throw new PurchaseOrderFetchError(
      'Missing organization ID: set ZOHO_ORGANIZATION_ID or ZOHO_BOOKS_ORGANIZATION_ID in .env.',
    )
  }

  const id = purchaseorderId.trim()
  if (!id) {
    throw new PurchaseOrderFetchError('Purchase order id is required.')
  }

  const token = await getAccessToken()
  const root = booksApiRoot()
  const url = `${root}/purchaseorders/${encodeURIComponent(id)}?organization_id=${encodeURIComponent(orgId)}`

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    cache: 'no-store',
  })

  const rawText = await res.text()
  const json = parseZohoJsonBody(rawText)

  if (!res.ok || !json || typeof json.code !== 'number') {
    throw formatZohoBooksFailure(res, json, rawText)
  }

  if (json.code !== 0 || !json.purchaseorder) {
    throw formatZohoBooksFailure(res, json, rawText)
  }

  return {
    viewModel: mapZohoPurchaseOrderPayload(json.purchaseorder),
    zohoApiResponse: json,
  }
}
