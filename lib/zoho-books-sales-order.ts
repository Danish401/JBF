import { getAccessToken } from '@/lib/zoho'
import { amountToWordsIntegerOnly, usdAmountToCommercialInvoiceWords } from '@/lib/amount-words'
import {
  DEFAULT_SALES_ORDER_VIEW,
  type SalesOrderViewModel,
} from '@/lib/sales-order-view-model'
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

function sellerCompanyName(): string {
  return process.env.SO_SELLER_COMPANY_NAME?.trim() || DEFAULT_SALES_ORDER_VIEW.header.sellerCompanyName
}

function sellerAddressLines(): string[] {
  const raw = process.env.SO_SELLER_ADDRESS_LINES?.trim()
  if (raw) {
    const lines = raw
      .split(/\r?\n|\\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (lines.length) return lines
  }
  return [...DEFAULT_SALES_ORDER_VIEW.header.sellerAddressLines]
}

function sellerTel(): string {
  return process.env.SO_SELLER_TEL?.trim() || DEFAULT_SALES_ORDER_VIEW.header.sellerTel
}

function sellerFax(): string {
  return process.env.SO_SELLER_FAX?.trim() || DEFAULT_SALES_ORDER_VIEW.header.sellerFax
}

function sellerTrn(): string {
  return process.env.SO_SELLER_TRN?.trim() || DEFAULT_SALES_ORDER_VIEW.header.sellerTrn
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

interface ZohoLineItemCustomField {
  customfield_id?: string
  api_name?: string
  label?: string
  value?: string | number
  value_formatted?: string
}

interface ZohoSoLineItem {
  item_order?: number
  line_item_id?: string
  item_id?: string
  sku?: string
  name?: string
  description?: string
  unit?: string
  quantity?: number
  rate?: number
  item_total?: number
  item_total_inclusive_of_tax?: number
  tax_amount?: number
  tax_percentage?: number
  item_custom_fields?: ZohoLineItemCustomField[]
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

interface ZohoTaxRow {
  tax_id?: string
  tax_name?: string
  tax_amount?: number
}

export interface ZohoSalesOrderPayload {
  salesorder_id?: string
  salesorder_number?: string
  date?: string
  reference_number?: string
  customer_name?: string
  gst_no?: string
  currency_code?: string
  sub_total?: number
  total?: number
  tax_total?: number
  taxes?: ZohoTaxRow[]
  notes?: string
  terms?: string
  shipment_date?: string
  delivery_method?: string
  is_inclusive_tax?: boolean
  price_precision?: number
  line_items?: ZohoSoLineItem[]
  billing_address?: ZohoAddr
  shipping_address?: ZohoAddr
  contact_persons_associated?: ZohoContactPerson[]
  custom_fields?: ZohoCustomFieldRow[]
  custom_field_hash?: Record<string, string | number | boolean | null | undefined>
}

export interface ZohoSoApiJson {
  code: number
  message?: string
  salesorder?: ZohoSalesOrderPayload
}

export function parseZohoSalesOrderJsonBody(text: string): ZohoSoApiJson | null {
  try {
    return JSON.parse(text) as ZohoSoApiJson
  } catch {
    return null
  }
}

function formatSoDate(iso: string | undefined, fallback: string): string {
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
  if (line1) {
    for (const part of line1.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
      lines.push(part)
    }
  }
  const line2 = addr.address2 || addr.street2
  if (line2) lines.push(line2)
  const zipStr = addr.zip !== undefined && addr.zip !== null ? String(addr.zip).trim() : ''
  const cityLine = [addr.city, addr.state, zipStr].filter(Boolean).join(', ')
  if (cityLine) lines.push(cityLine)
  if (addr.country) lines.push(addr.country)
  return lines.length ? lines : []
}

function customFieldString(
  so: ZohoSalesOrderPayload,
  apiName: string,
): string | undefined {
  const hash = so.custom_field_hash
  if (hash && hash[apiName] != null && hash[apiName] !== '') {
    const v = hash[apiName]
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    return String(v)
  }
  const row = so.custom_fields?.find((f) => f.api_name === apiName)
  if (row) {
    const raw = row.value_formatted ?? row.value
    if (raw === undefined || raw === null || raw === '') return undefined
    return String(raw)
  }
  return undefined
}

function lineCustomField(
  fields: ZohoLineItemCustomField[] | undefined,
  ...needles: string[]
): string {
  if (!fields?.length) return ''
  const nlow = needles.map((n) => n.toLowerCase())
  for (const f of fields) {
    const lab = `${f.label || ''} ${f.api_name || ''}`.toLowerCase()
    if (nlow.some((n) => lab.includes(n))) {
      const raw = f.value_formatted ?? f.value
      if (raw === undefined || raw === null) return ''
      return String(raw).trim()
    }
  }
  return ''
}

function appendZohoRemarksToDefaults(defaultRemarks: string[], so: ZohoSalesOrderPayload): string[] {
  const out = [...defaultRemarks]
  const pushBlock = (label: string, text: string | undefined) => {
    if (!text?.trim()) return
    for (const line of text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)) {
      out.push(`${label}: ${line}`)
    }
  }
  pushBlock('NOTE', so.notes)
  pushBlock('TERMS', so.terms)
  if (so.reference_number?.trim()) {
    out.push(`REFERENCE: ${so.reference_number}`)
  }
  return out
}

/** Display e.g. "10%" from Zoho Books line `tax_percentage`. */
function formatLineTaxPercent(p: number | undefined | null): string {
  if (p === undefined || p === null || Number.isNaN(Number(p))) return ''
  const n = Number(p)
  if (n === 0) return '0%'
  const rounded = Math.round(n * 100) / 100
  const s = Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/\.?0+$/, '')
  return `${s}%`
}

function amountInWordsForCurrency(total: number, currencyCode: string): string {
  const code = (currencyCode || 'USD').toUpperCase()
  if (code === 'USD') {
    return usdAmountToCommercialInvoiceWords(total)
  }
  return amountToWordsIntegerOnly(Math.floor(total + 1e-9), code)
}

function mapLineItems(
  items: ZohoSoLineItem[] | undefined,
  precision: number,
  isInclusiveTax: boolean,
): SalesOrderViewModel['lineItems'] {
  if (!items?.length) {
    return DEFAULT_SALES_ORDER_VIEW.lineItems
  }
  const sorted = [...items].sort((a, b) => (a.item_order ?? 0) - (b.item_order ?? 0))
  return sorted.map((row, idx) => {
    const qty = row.quantity ?? 0
    const rate = row.rate ?? 0
    const lineSub =
      row.item_total ??
      (typeof qty === 'number' && typeof rate === 'number' ? qty * rate : undefined) ??
      0
    const taxAmt = row.tax_amount ?? 0
    const lineTotal =
      row.item_total_inclusive_of_tax ??
      (isInclusiveTax ? lineSub : lineSub + (typeof taxAmt === 'number' ? taxAmt : 0))
    const baseForDisplay = isInclusiveTax ? lineTotal - taxAmt : lineSub

    const cf = (...needles: string[]) => lineCustomField(row.item_custom_fields, ...needles)

    return {
      srNo: idx + 1,
      customerReference: (row.sku || row.line_item_id || '').toString() || '—',
      type: row.name?.trim() || '—',
      thickness: cf('thick', 'thickness'),
      core: cf('core'),
      width: cf('width'),
      length: cf('length'),
      treatmentIn: cf('treatment in', 'treatment_in'),
      treatmentOut: cf('treatment out', 'treatment_out'),
      opticalDensity: cf('optical', 'density', 'o.d'),
      quantity: formatMoney(qty, precision),
      basePriceRateUsd: formatMoney(rate, precision),
      baseValueUsd: formatMoney(baseForDisplay, precision),
      taxPercent: formatLineTaxPercent(row.tax_percentage),
      totalUsd: formatMoney(
        typeof lineTotal === 'number' && !Number.isNaN(lineTotal) ? lineTotal : baseForDisplay + taxAmt,
        precision,
      ),
    }
  })
}

export function mapZohoSalesOrderPayload(so: ZohoSalesOrderPayload): SalesOrderViewModel {
  const vm = structuredClone(DEFAULT_SALES_ORDER_VIEW)
  const precision =
    typeof so.price_precision === 'number' && so.price_precision >= 0 ? so.price_precision : 2

  const currency = so.currency_code?.trim() || 'USD'

  vm.header.sellerCompanyName = sellerCompanyName()
  vm.header.sellerAddressLines = sellerAddressLines()
  vm.header.sellerTel = sellerTel()
  vm.header.sellerFax = sellerFax()
  vm.header.sellerTrn = sellerTrn()
  vm.header.salesOrderNo = so.salesorder_number || vm.header.salesOrderNo
  vm.header.salesOrderDate = formatSoDate(so.date, vm.header.salesOrderDate)
  vm.header.revisions = customFieldString(so, 'cf_revisions') ?? ''

  vm.buyer.name = so.customer_name || vm.buyer.name
  const bill = so.billing_address
  const billLines = addressToLines(bill)
  if (billLines.length) vm.buyer.addressLines = billLines

  const primaryContact = so.contact_persons_associated?.[0]
  if (primaryContact) {
    const name =
      primaryContact.contact_person_name ||
      [primaryContact.first_name, primaryContact.last_name].filter(Boolean).join(' ')
    if (name) vm.buyer.contactPerson = name
    if (primaryContact.contact_person_email) vm.buyer.email = primaryContact.contact_person_email
    const ph = primaryContact.phone || primaryContact.mobile
    if (ph) vm.buyer.phone = ph
  } else if (bill?.attention?.trim()) {
    vm.buyer.contactPerson = bill.attention
  }
  if (bill?.phone?.trim()) vm.buyer.phone = bill.phone
  if (bill?.email?.trim()) vm.buyer.email = bill.email
  if (bill?.fax?.trim()) vm.buyer.fax = bill.fax

  vm.buyer.poNo = so.reference_number?.trim() ? so.reference_number : vm.buyer.poNo
  const rawPoDate = customFieldString(so, 'cf_po_date')
  if (rawPoDate && /^\d{4}-\d{2}-\d{2}$/.test(rawPoDate)) {
    vm.buyer.poDate = formatSoDate(rawPoDate, vm.buyer.poDate)
  } else if (rawPoDate?.trim()) {
    vm.buyer.poDate = rawPoDate.trim()
  }
  const deliveryTerms =
    customFieldString(so, 'cf_delivery_terms')?.trim() || so.delivery_method?.trim()
  if (deliveryTerms) vm.buyer.deliveryTerms = deliveryTerms
  if (so.terms?.trim()) vm.buyer.paymentTerms = so.terms.trim()
  if (so.gst_no?.trim()) vm.buyer.trn = so.gst_no
  const buyerTrn = customFieldString(so, 'cf_trn_buyer') ?? customFieldString(so, 'cf_trn_no')
  if (buyerTrn) vm.buyer.trn = buyerTrn

  const ship = so.shipping_address
  const shipLines = addressToLines(ship)
  vm.billToParty.name = bill?.attention || so.customer_name || vm.billToParty.name
  if (billLines.length) vm.billToParty.addressLines = [...billLines]
  vm.billToParty.phone = bill?.phone?.trim() ? bill.phone : vm.billToParty.phone
  vm.billToParty.fax = bill?.fax?.trim() ? bill.fax : vm.billToParty.fax
  vm.billToParty.email = bill?.email?.trim() ? bill.email : vm.billToParty.email
  const billContact = customFieldString(so, 'cf_bill_to_contact')
  if (billContact?.trim()) vm.billToParty.contactPerson = billContact.trim()
  else if (vm.buyer.contactPerson) vm.billToParty.contactPerson = vm.buyer.contactPerson

  const cfOrigin = customFieldString(so, 'cf_country_of_origin')
  const cfFinalDest = customFieldString(so, 'cf_final_destination')
  const cfPallet = customFieldString(so, 'cf_pallet_shipping_mark')
  const cfMaterial = customFieldString(so, 'cf_material_description')
  if (cfOrigin) vm.billToParty.countryOfOrigin = cfOrigin
  if (cfFinalDest) vm.billToParty.finalDestination = cfFinalDest
  if (cfPallet) vm.billToParty.palletShippingMark = cfPallet
  if (cfMaterial) vm.billToParty.materialDescription = cfMaterial
  const billTrn = customFieldString(so, 'cf_trn_bill_to') ?? customFieldString(so, 'cf_trn_no1')
  if (billTrn) vm.billToParty.trn = billTrn

  vm.consignee.name = ship?.attention || so.customer_name || vm.consignee.name
  if (shipLines.length) vm.consignee.addressLines = shipLines
  if (ship?.phone?.trim()) vm.consignee.phone = ship.phone
  if (ship?.fax?.trim()) vm.consignee.fax = ship.fax
  if (ship?.email?.trim()) vm.consignee.email = ship.email
  const consigneeContact = customFieldString(so, 'cf_consignee_contact')
  if (consigneeContact?.trim()) vm.consignee.contactPerson = consigneeContact.trim()
  else if (vm.buyer.contactPerson) vm.consignee.contactPerson = vm.buyer.contactPerson

  const cfPol = customFieldString(so, 'cf_port_of_loading')
  const cfPod = customFieldString(so, 'cf_port_of_discharge') ?? customFieldString(so, 'cf_post_of_discharge')
  const cfCountryDest = customFieldString(so, 'cf_country_of_final_destination')
  if (cfPol) vm.consignee.portOfLoading = cfPol
  if (cfPod) vm.consignee.portOfDischarge = cfPod
  if (cfCountryDest) vm.consignee.countryOfFinalDestination = cfCountryDest
  if (so.delivery_method?.trim()) vm.consignee.modeOfShipment = so.delivery_method
  const consigneeTrn = customFieldString(so, 'cf_trn_consignee') ?? customFieldString(so, 'cf_trn_no2')
  if (consigneeTrn) vm.consignee.trn = consigneeTrn

  vm.lineItems = mapLineItems(so.line_items, precision, so.is_inclusive_tax === true)

  const sub = so.sub_total ?? 0
  const tax = so.tax_total ?? 0
  const tot = so.total ?? sub + tax
  vm.totals.subTotal = formatMoney(sub, precision)
  const taxLabel =
    so.taxes?.find((t) => (t.tax_amount ?? 0) > 0)?.tax_name?.trim() ||
    (tax > 0 ? 'Tax' : vm.totals.tariffLabel)
  vm.totals.tariffLabel = taxLabel || vm.totals.tariffLabel
  vm.totals.tariffAmount = formatMoney(tax, precision)
  vm.totals.grandTotal = formatMoney(tot, precision)
  vm.totals.amountInWords = amountInWordsForCurrency(tot, currency)

  const notify = customFieldString(so, 'cf_notifying_party')
  if (notify) vm.notifyingParty = notify

  vm.remarks = appendZohoRemarksToDefaults(DEFAULT_SALES_ORDER_VIEW.remarks, so)

  const extra = customFieldString(so, 'cf_additional_remarks')
  if (extra?.trim()) vm.additionalRemarks = extra

  const shipDate = so.shipment_date && /^\d{4}-\d{2}-\d{2}$/.test(so.shipment_date)
    ? formatSoDate(so.shipment_date, '')
    : '______________'
  const eta = customFieldString(so, 'cf_eta_customer') || '______________'
  vm.shipmentLine = `SHIPMENT: ETD BAHRAIN ${shipDate} & ETA TO CUSTOMER WILL BE ${eta}`

  return vm
}

export class SalesOrderFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly zohoApiCode?: number,
  ) {
    super(message)
    this.name = 'SalesOrderFetchError'
  }

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

export function formatZohoSalesOrderFailure(
  res: Response,
  json: ZohoSoApiJson | null,
  fallbackBody: string,
): SalesOrderFetchError {
  const zohoCode = json?.code
  const msg =
    json?.message?.trim() ||
    (fallbackBody.slice(0, 200) || `HTTP ${res.status} ${res.statusText}`)
  const suffix =
    zohoCode !== undefined && zohoCode !== null ? ` (Zoho API code ${zohoCode})` : ''
  return new SalesOrderFetchError(`${msg}${suffix}`, res.status, zohoCode)
}

/** OAuth scopes for the consent URL (read sales orders + org/settings if needed). */
export const ZOHO_BOOKS_OAUTH_SCOPES_SALESORDERS_READ =
  'ZohoBooks.salesorders.READ,ZohoBooks.settings.READ'

export function getConfiguredZohoBooksApiRootForSalesOrder(): string {
  return booksApiRoot()
}

export function getZohoAccountsOAuthBaseUrlForSalesOrder(): string {
  return accountsOAuthBaseFromApiRoot(booksApiRoot())
}

export function getZohoApiConsoleBaseUrlForSalesOrder(): string {
  return apiConsoleBaseFromApiRoot(booksApiRoot())
}

export interface SalesOrderZohoApiFetchResult {
  viewModel: SalesOrderViewModel
  zohoApiResponse: ZohoSoApiJson
}

export async function fetchSalesOrderFromZohoBooks(
  salesorderId: string,
): Promise<SalesOrderZohoApiFetchResult> {
  const orgId = getZohoOrganizationId()
  if (!orgId) {
    throw new SalesOrderFetchError(
      'Missing organization ID: set ZOHO_ORGANIZATION_ID or ZOHO_BOOKS_ORGANIZATION_ID in .env.',
    )
  }

  const id = salesorderId.trim()
  if (!id) {
    throw new SalesOrderFetchError('Sales order id is required.')
  }

  const token = await getAccessToken()
  const root = booksApiRoot()
  const url = `${root}/salesorders/${encodeURIComponent(id)}?organization_id=${encodeURIComponent(orgId)}`

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    cache: 'no-store',
  })

  const rawText = await res.text()
  const json = parseZohoSalesOrderJsonBody(rawText)

  if (!res.ok || !json || typeof json.code !== 'number') {
    throw formatZohoSalesOrderFailure(res, json, rawText)
  }

  if (json.code !== 0 || !json.salesorder) {
    throw formatZohoSalesOrderFailure(res, json, rawText)
  }

  return {
    viewModel: mapZohoSalesOrderPayload(json.salesorder),
    zohoApiResponse: json,
  }
}
