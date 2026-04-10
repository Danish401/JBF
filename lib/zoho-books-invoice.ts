import { getAccessToken } from '@/lib/zoho'
import {
  accountsOAuthBaseFromApiRoot,
  apiConsoleBaseFromApiRoot,
} from '@/lib/zoho-regional-urls'
import { getZohoOrganizationId } from '@/lib/zoho-org-id'
import {
  DEFAULT_COMMERCIAL_INVOICE_VIEW,
  type CommercialInvoiceLineItem,
  type CommercialInvoiceParty,
  type CommercialInvoiceProductSpec,
  type CommercialInvoiceTariffLine,
  type CommercialInvoiceViewModel,
} from '@/lib/commercial-invoice-view-model'

const DEFAULT_BOOKS_ROOT = 'https://www.zohoapis.com/books/v3'

function booksApiRoot(): string {
  const raw = process.env.ZOHO_BOOKS_API_ROOT?.trim()
  if (raw) return raw.replace(/\/$/, '')
  return DEFAULT_BOOKS_ROOT
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

interface ZohoInvoiceTax {
  tax_name?: string
  tax_amount?: number
}

interface ZohoInvoiceLineItem {
  line_item_id?: string
  item_id?: string
  sku?: string
  name?: string
  description?: string
  quantity?: number
  rate?: number
  unit?: string
  item_total?: number
  item_order?: number
  header_name?: string
  header_id?: string
  item_custom_fields?: ZohoCustomFieldRow[]
}

export interface ZohoInvoicePayload {
  invoice_id?: string
  invoice_number?: string
  date?: string
  due_date?: string
  reference_number?: string
  customer_name?: string
  customer_id?: string
  currency_code?: string
  price_precision?: number
  exchange_rate?: number
  sub_total?: number
  tax_total?: number
  total?: number
  adjustment?: number
  notes?: string
  terms?: string
  payment_terms?: number
  payment_terms_label?: string
  salesorder_number?: string
  billing_address?: ZohoAddr
  shipping_address?: ZohoAddr
  contact_persons_associated?: ZohoContactPerson[]
  line_items?: ZohoInvoiceLineItem[]
  taxes?: ZohoInvoiceTax[]
  custom_fields?: ZohoCustomFieldRow[]
  custom_field_hash?: Record<string, string | number | boolean | null | undefined>
}

export interface ZohoInvoiceApiJson {
  code: number
  message?: string
  invoice?: ZohoInvoicePayload
}

export function parseZohoInvoiceJsonBody(text: string): ZohoInvoiceApiJson | null {
  try {
    return JSON.parse(text) as ZohoInvoiceApiJson
  } catch {
    return null
  }
}

function formatInvoiceDate(iso: string | undefined, fallback: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fallback
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** Custom fields may be ISO dates or already-formatted display text. */
function formatBooksDateOrPassthrough(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback
  const t = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return formatInvoiceDate(t, fallback)
  return t
}

/** Split one Zoho field like "40,209.93 LBS / 18,238.90 KGS" into left/right of the slash. */
function splitSlashPair(raw: string | undefined): { left: string; right: string } | null {
  if (!raw?.trim()) return null
  const t = raw.trim()
  const idx = t.indexOf('/')
  if (idx === -1) return { left: t, right: '' }
  return { left: t.slice(0, idx).trim(), right: t.slice(idx + 1).trim() }
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
  inv: ZohoInvoicePayload,
  apiName: string,
): string | undefined {
  const hash = inv.custom_field_hash
  if (hash && hash[apiName] != null && hash[apiName] !== '') {
    const v = hash[apiName]
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    return String(v)
  }
  const row = inv.custom_fields?.find((f) => f.api_name === apiName)
  if (row) {
    const raw = row.value_formatted ?? row.value
    if (raw === undefined || raw === null || raw === '') return undefined
    return String(raw)
  }
  return undefined
}

function lineCustomFieldString(row: ZohoInvoiceLineItem, apiName: string): string | undefined {
  const found = row.item_custom_fields?.find((f) => f.api_name === apiName)
  if (!found) return undefined
  const raw = found.value_formatted ?? found.value
  if (raw === undefined || raw === null || raw === '') return undefined
  return String(raw)
}

/** Always TYPE → THICKNESS (GAUGE) → WIDTH (INCH) — reads line-item custom fields from Zoho Books. */
function canonicalLineSpecs(row: ZohoInvoiceLineItem): CommercialInvoiceProductSpec[] {
  const type =
    lineCustomFieldString(row, 'cf_type') || lineCustomFieldString(row, 'cf_item_type') || ''
  const thick =
    lineCustomFieldString(row, 'cf_thickness') ||
    lineCustomFieldString(row, 'cf_thickness_gauge') ||
    lineCustomFieldString(row, 'cf_gauge') ||
    ''
  const width =
    lineCustomFieldString(row, 'cf_width') ||
    lineCustomFieldString(row, 'cf_width_inch') ||
    ''
  return [
    { label: 'TYPE', value: type },
    { label: 'THICKNESS (GAUGE)', value: thick },
    { label: 'WIDTH (INCH)', value: width },
  ]
}

function contactLinesFromAddress(addr: ZohoAddr | undefined): string[] {
  const out: string[] = []
  if (!addr) return out
  if (addr.attention?.trim()) out.push(`Contact: ${addr.attention.trim()}`)
  if (addr.phone?.trim()) out.push(`Phone: ${addr.phone.trim()}`)
  if (addr.fax?.trim()) out.push(`Fax: ${addr.fax.trim()}`)
  if (addr.email?.trim()) out.push(`Email: ${addr.email.trim()}`)
  return out
}

function contactLinesFromPerson(p: ZohoContactPerson | undefined): string[] {
  if (!p) return []
  const out: string[] = []
  const name =
    p.contact_person_name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
  if (name) out.push(`Contact: ${name}`)
  const ph = p.phone || p.mobile
  if (ph?.trim()) out.push(`Phone: ${ph.trim()}`)
  if (p.contact_person_email?.trim()) out.push(`Email: ${p.contact_person_email.trim()}`)
  return out
}

function partyFromAddressAndContacts(
  addr: ZohoAddr | undefined,
  customerName: string,
  persons: ZohoContactPerson[] | undefined,
): CommercialInvoiceParty {
  const lines = addressToLines(addr)
  const name =
    (addr?.attention && addr.attention.trim()) ||
    (customerName?.trim() ? customerName.trim() : DEFAULT_COMMERCIAL_INVOICE_VIEW.consignee.name)
  const addrLines = lines.length ? lines : ['—']
  const fromAddr = contactLinesFromAddress(addr)
  const fromPerson = contactLinesFromPerson(persons?.[0])
  const contactLines = [...fromPerson, ...fromAddr.filter((l) => !fromPerson.some((p) => p === l))]
  return {
    name,
    addressLines: addrLines,
    contactLines: contactLines.length ? contactLines : undefined,
  }
}

function partiesEqual(a: CommercialInvoiceParty, b: CommercialInvoiceParty): boolean {
  return (
    a.name === b.name &&
    a.addressLines.join('|') === b.addressLines.join('|') &&
    (a.contactLines?.join('|') || '') === (b.contactLines?.join('|') || '')
  )
}

function isRenderableLineItem(row: ZohoInvoiceLineItem): boolean {
  if (row.header_name?.trim() && !row.name?.trim() && !row.description?.trim()) return false
  if (row.header_name && row.header_id) return false
  if (row.header_name && (row.quantity === undefined || row.quantity === 0) && !row.item_total) {
    return false
  }
  const hasLabel = Boolean(row.name?.trim() || row.description?.trim())
  const hasFigures =
    (row.quantity !== undefined && row.quantity !== 0) ||
    (row.item_total !== undefined && row.item_total !== 0) ||
    (row.rate !== undefined && row.rate !== 0)
  return hasLabel && hasFigures
}

function mapLineItems(
  items: ZohoInvoiceLineItem[] | undefined,
  precision: number,
): CommercialInvoiceLineItem[] {
  if (!items?.length) return []
  const sorted = [...items].sort((a, b) => (a.item_order ?? 0) - (b.item_order ?? 0))
  const out: CommercialInvoiceLineItem[] = []
  for (const row of sorted) {
    if (!isRenderableLineItem(row)) continue
    const title = row.name?.trim() || 'Item'
    const descLines: string[] = []
    if (row.description?.trim()) {
      descLines.push(
        ...row.description
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      )
    }
    if (row.sku?.trim()) {
      descLines.unshift(`SKU: ${row.sku.trim()}`)
    }
    const hs = lineCustomFieldString(row, 'cf_hs_code') || lineCustomFieldString(row, 'cf_hsn')
    if (hs) descLines.push(`HS CODE: ${hs}`)
    const qty = row.quantity ?? 0
    const rate = row.rate ?? 0
    const total = row.item_total ?? rate * qty
    const specs = canonicalLineSpecs(row)
    out.push({
      descriptionTitle: title,
      descriptionBodyLines: descLines,
      specs,
      quantityLbs: formatMoney(qty, Math.min(6, Math.max(precision, 2))),
      unitRateUsd: formatMoney(rate, precision),
      amountUsd: formatMoney(total, precision),
    })
  }
  return out
}

function mapTariffLines(inv: ZohoInvoicePayload, precision: number): CommercialInvoiceTariffLine[] {
  const lines: CommercialInvoiceTariffLine[] = []
  const fromTaxes = inv.taxes?.filter((t) => (t.tax_amount ?? 0) !== 0) ?? []
  if (fromTaxes.length) {
    for (const t of fromTaxes) {
      const amt = t.tax_amount ?? 0
      lines.push({
        label: t.tax_name?.trim() || 'Tax',
        amountUsd: formatMoney(amt, precision),
      })
    }
    return lines
  }
  const taxTotal = inv.tax_total ?? 0
  if (Math.abs(taxTotal) > 1e-6) {
    lines.push({
      label: customFieldString(inv, 'cf_tax_label') || 'Tax (Zoho Books)',
      amountUsd: formatMoney(taxTotal, precision),
    })
  }
  const adj = inv.adjustment ?? 0
  if (Math.abs(adj) > 1e-6) {
    lines.push({
      label: 'Adjustment',
      amountUsd: formatMoney(adj, precision),
    })
  }
  return lines
}

/** Zoho default payment label; omit from “Terms of Delivery and Payment” when using invoice Terms / fallback. */
function isDueOnReceiptPaymentLabel(label: string | undefined): boolean {
  if (!label?.trim()) return false
  return /^due\s+on\s+receipt\.?$/i.test(label.trim())
}

function termsLines(inv: ZohoInvoicePayload): string[] {
  const cf = customFieldString(inv, 'cf_terms_of_delivery_and_payment')?.trim()
  if (cf) {
    return cf
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const lines: string[] = []
  const label = inv.payment_terms_label?.trim()
  if (label && !isDueOnReceiptPaymentLabel(label)) {
    lines.push(label)
  }
  if (inv.terms?.trim()) {
    lines.push(
      ...inv.terms
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }
  if (lines.length) return lines
  return ['—']
}

export function mapZohoInvoicePayload(inv: ZohoInvoicePayload): CommercialInvoiceViewModel {
  const vm = structuredClone(DEFAULT_COMMERCIAL_INVOICE_VIEW)
  const precision =
    typeof inv.price_precision === 'number' && inv.price_precision >= 0 ? inv.price_precision : 2

  vm.poNo = ''
  vm.poDate = ''
  vm.salesContractNo = ''
  vm.salesContractDate = ''
  vm.footerHsCodeLine = undefined
  vm.summaryBlock.originNote = undefined
  vm.summaryBlock.totalPallets = ''
  vm.summaryBlock.totalRolls = ''
  vm.summaryBlock.totalNetLbs = ''
  vm.summaryBlock.totalNetKgs = ''
  vm.summaryBlock.totalGrossLbs = ''
  vm.summaryBlock.totalGrossKgs = ''
  vm.summaryBlock.shippingMarks = ''
  vm.tariffLines = []
  vm.shipping = {
    preCarriedByLeft: '',
    preCarriedByRight: '',
    vesselNameVoyage: '',
    portOfDischarge: '',
    portOfLoading: '',
    finalDestination: '',
  }
  vm.countryOfOrigin = ''
  vm.countryOfFinalDestination = ''

  const customerName = inv.customer_name?.trim() || vm.consignee.name
  const persons = inv.contact_persons_associated

  const shipParty = partyFromAddressAndContacts(inv.shipping_address, customerName, persons)
  const billParty = partyFromAddressAndContacts(inv.billing_address, customerName, persons)

  vm.consignee = shipParty.addressLines[0] !== '—' ? shipParty : billParty
  vm.buyer = partiesEqual(billParty, vm.consignee) ? vm.consignee : billParty

  vm.invoiceNo = inv.invoice_number?.trim() || inv.invoice_id || ''
  vm.invoiceDateDtd = formatInvoiceDate(inv.date, '')

  vm.salesContractNo =
    customFieldString(inv, 'cf_sales_order_no') ||
    customFieldString(inv, 'cf_so_no') ||
    inv.salesorder_number?.trim() ||
    ''
  vm.salesContractDate = formatBooksDateOrPassthrough(
    customFieldString(inv, 'cf_sales_order_date_formatted') ||
      customFieldString(inv, 'cf_sales_order_date') ||
      customFieldString(inv, 'cf_so_date'),
    '',
  )

  vm.poNo = customFieldString(inv, 'cf_po_no') || inv.reference_number?.trim() || ''
  vm.poDate = formatBooksDateOrPassthrough(
    customFieldString(inv, 'cf_po_date_text') || customFieldString(inv, 'cf_po_date'),
    '',
  )

  vm.shipping.preCarriedByLeft =
    customFieldString(inv, 'cf_pre_carried_by_left') ||
    customFieldString(inv, 'cf_pre_carried_by') ||
    ''
  vm.shipping.preCarriedByRight =
    customFieldString(inv, 'cf_pre_carried_by_right') ||
    customFieldString(inv, 'cf_pre_carried_by1') ||
    ''
  vm.shipping.vesselNameVoyage =
    customFieldString(inv, 'cf_vessel_name_voyage_no') || customFieldString(inv, 'cf_vessel_voyage') || ''
  vm.shipping.portOfDischarge = customFieldString(inv, 'cf_port_of_discharge') || ''
  vm.shipping.portOfLoading = customFieldString(inv, 'cf_port_of_loading') || ''
  vm.shipping.finalDestination = customFieldString(inv, 'cf_final_destination') || ''

  vm.countryOfOrigin = customFieldString(inv, 'cf_country_of_origin') || ''
  vm.countryOfFinalDestination =
    customFieldString(inv, 'cf_country_of_final_destination') ||
    customFieldString(inv, 'cf_country_of_final_destination_goods') ||
    ''

  vm.termsDeliveryPaymentLines = termsLines(inv)

  const mappedLines = mapLineItems(inv.line_items, precision)
  vm.lineItems =
    mappedLines.length > 0
      ? mappedLines
      : [
          {
            descriptionTitle: '—',
            descriptionBodyLines: [],
            specs: [
              { label: 'TYPE', value: '' },
              { label: 'THICKNESS (GAUGE)', value: '' },
              { label: 'WIDTH (INCH)', value: '' },
            ],
            quantityLbs: '—',
            unitRateUsd: '—',
            amountUsd: '—',
          },
        ]
  vm.tariffLines = mapTariffLines(inv, precision)

  const pallets = customFieldString(inv, 'cf_total_pallets')
  const rolls = customFieldString(inv, 'cf_total_rolls')
  const netCombined = customFieldString(inv, 'cf_total_net_weight')
  const grossCombined = customFieldString(inv, 'cf_total_gross_weight')
  const marks = customFieldString(inv, 'cf_shipping_marks')
  const originNote = customFieldString(inv, 'cf_origin_note')

  if (pallets) vm.summaryBlock.totalPallets = pallets
  if (rolls) vm.summaryBlock.totalRolls = rolls

  const netPair = netCombined ? splitSlashPair(netCombined) : null
  if (netPair && (netPair.left || netPair.right)) {
    vm.summaryBlock.totalNetLbs = netPair.left
    vm.summaryBlock.totalNetKgs = netPair.right
  } else {
    const netLbs = customFieldString(inv, 'cf_total_net_weight_lbs')
    const netKgs = customFieldString(inv, 'cf_total_net_weight_kgs')
    if (netLbs) vm.summaryBlock.totalNetLbs = netLbs.includes('LBS') ? netLbs : `${netLbs} LBS`
    if (netKgs) vm.summaryBlock.totalNetKgs = netKgs.includes('KGS') ? netKgs : `${netKgs} KGS`
  }

  const grossPair = grossCombined ? splitSlashPair(grossCombined) : null
  if (grossPair && (grossPair.left || grossPair.right)) {
    vm.summaryBlock.totalGrossLbs = grossPair.left
    vm.summaryBlock.totalGrossKgs = grossPair.right
  } else {
    const grossLbs = customFieldString(inv, 'cf_total_gross_weight_lbs')
    const grossKgs = customFieldString(inv, 'cf_total_gross_weight_kgs')
    if (grossLbs) vm.summaryBlock.totalGrossLbs = grossLbs.includes('LBS') ? grossLbs : `${grossLbs} LBS`
    if (grossKgs) vm.summaryBlock.totalGrossKgs = grossKgs.includes('KGS') ? grossKgs : `${grossKgs} KGS`
  }

  if (marks) vm.summaryBlock.shippingMarks = marks
  if (originNote) vm.summaryBlock.originNote = originNote

  const total = inv.total ?? inv.sub_total ?? 0
  vm.totalAmountNumeric = typeof total === 'number' && !Number.isNaN(total) ? total : 0
  vm.totalAmountUsd = formatMoney(vm.totalAmountNumeric, precision)
  vm.currencyCode = inv.currency_code?.trim() || 'USD'

  const firstHs =
    inv.line_items
      ?.map((li) => lineCustomFieldString(li, 'cf_hs_code') || lineCustomFieldString(li, 'cf_hsn'))
      .find(Boolean) || customFieldString(inv, 'cf_hs_code_footer')
  if (firstHs) vm.footerHsCodeLine = `HS CODE: ${firstHs}`

  const exporterTrn = process.env.ZOHO_COMMERCIAL_INVOICE_EXPORTER_TRN?.trim()
  if (exporterTrn) {
    vm.exporter.trn = exporterTrn.toUpperCase().startsWith('TRN')
      ? exporterTrn
      : `TRN: ${exporterTrn}`
  }

  vm.signatoryBlockTitle = `For ${vm.exporter.companyName}`

  if (inv.invoice_id) vm.sourceZohoInvoiceId = inv.invoice_id

  return vm
}

export class InvoiceFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly zohoApiCode?: number,
  ) {
    super(message)
    this.name = 'InvoiceFetchError'
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

export function formatZohoInvoiceFailure(
  res: Response,
  json: ZohoInvoiceApiJson | null,
  fallbackBody: string,
): InvoiceFetchError {
  const zohoCode = json?.code
  const msg =
    json?.message?.trim() ||
    (fallbackBody.slice(0, 200) || `HTTP ${res.status} ${res.statusText}`)
  const suffix =
    zohoCode !== undefined && zohoCode !== null ? ` (Zoho API code ${zohoCode})` : ''
  return new InvoiceFetchError(`${msg}${suffix}`, res.status, zohoCode)
}

/** Scopes for consent URL: read invoices + org id from settings. */
export const ZOHO_BOOKS_OAUTH_SCOPES_INVOICES_RECOMMENDED =
  'ZohoBooks.invoices.READ,ZohoBooks.settings.READ'

export const ZOHO_BOOKS_OAUTH_SCOPES_INVOICES_ONLY = 'ZohoBooks.invoices.READ'

export function getConfiguredZohoBooksApiRootForInvoices(): string {
  return booksApiRoot()
}

export function getZohoAccountsOAuthBaseUrlForInvoices(): string {
  return accountsOAuthBaseFromApiRoot(booksApiRoot())
}

export function getZohoApiConsoleBaseUrlForInvoices(): string {
  return apiConsoleBaseFromApiRoot(booksApiRoot())
}

export interface InvoiceZohoApiFetchResult {
  viewModel: CommercialInvoiceViewModel
  zohoApiResponse: ZohoInvoiceApiJson
}

export async function fetchInvoiceFromZohoBooks(invoiceId: string): Promise<InvoiceZohoApiFetchResult> {
  const orgId = getZohoOrganizationId()
  if (!orgId) {
    throw new InvoiceFetchError(
      'Missing organization ID: set ZOHO_ORGANIZATION_ID or ZOHO_BOOKS_ORGANIZATION_ID in .env.',
    )
  }

  const id = invoiceId.trim()
  if (!id) {
    throw new InvoiceFetchError('Invoice id is required.')
  }

  const token = await getAccessToken()
  const root = booksApiRoot()
  const url = `${root}/invoices/${encodeURIComponent(id)}?organization_id=${encodeURIComponent(orgId)}`

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    cache: 'no-store',
  })

  const rawText = await res.text()
  const json = parseZohoInvoiceJsonBody(rawText)

  if (!res.ok || !json || typeof json.code !== 'number') {
    throw formatZohoInvoiceFailure(res, json, rawText)
  }

  if (json.code !== 0 || !json.invoice) {
    throw formatZohoInvoiceFailure(res, json, rawText)
  }

  return {
    viewModel: mapZohoInvoicePayload(json.invoice),
    zohoApiResponse: json,
  }
}
