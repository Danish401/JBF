import { getAccessToken } from '@/lib/zoho'
import {
  accountsOAuthBaseFromApiRoot,
  apiConsoleBaseFromApiRoot,
} from '@/lib/zoho-regional-urls'
import { getZohoOrganizationId } from '@/lib/zoho-org-id'
import {
  PurchaseOrderFetchError,
  formatZohoBooksFailure,
  mapZohoPurchaseOrderPayload,
  parseZohoJsonBody,
  type ZohoPurchaseOrderPayload,
} from '@/lib/zoho-books-purchase-order'
import type { PurchaseOrderZohoApiFetchResult } from '@/lib/zoho-books-purchase-order'
import type { PurchaseOrderViewModel } from '@/lib/purchase-order-view-model'

const DEFAULT_INVENTORY_ROOT = 'https://www.zohoapis.com/inventory/v1'

function inventoryApiRoot(): string {
  const raw = process.env.ZOHO_INVENTORY_API_ROOT?.trim()
  if (raw) return raw.replace(/\/$/, '')
  return DEFAULT_INVENTORY_ROOT
}

function firstAddressBlock(addr: unknown): ZohoPurchaseOrderPayload['billing_address'] {
  if (!addr) return undefined
  const block = Array.isArray(addr) ? addr[0] : addr
  if (!block || typeof block !== 'object') return undefined
  const o = block as Record<string, unknown>
  const line = o.address != null ? String(o.address) : undefined
  const line1 = o.address1 != null ? String(o.address1) : line
  return {
    address: line1,
    address1: line1,
    address2: o.address2 != null ? String(o.address2) : undefined,
    street2: o.street2 != null ? String(o.street2) : undefined,
    city: o.city != null ? String(o.city) : undefined,
    state: o.state != null ? String(o.state) : undefined,
    zip: o.zip != null ? String(o.zip) : undefined,
    country: o.country != null ? String(o.country) : undefined,
    fax: o.fax != null ? String(o.fax) : undefined,
    phone: o.phone != null ? String(o.phone) : undefined,
    attention: o.attention != null ? String(o.attention) : undefined,
    email: o.email != null ? String(o.email) : undefined,
  }
}

function normalizeInventoryPurchaseOrder(inv: Record<string, unknown>): ZohoPurchaseOrderPayload {
  const lineItemsRaw = inv.line_items
  const line_items = Array.isArray(lineItemsRaw)
    ? lineItemsRaw.map((row) => {
        const li = row as Record<string, unknown>
        const rate =
          (typeof li.rate === 'number' ? li.rate : undefined) ??
          (typeof li.purchase_rate === 'number' ? li.purchase_rate : undefined) ??
          (typeof li.bcy_rate === 'number' ? li.bcy_rate : undefined)
        const qty =
          typeof li.quantity === 'number'
            ? li.quantity
            : li.quantity != null
              ? Number(li.quantity)
              : undefined
        return {
          item_id: li.item_id != null ? String(li.item_id) : undefined,
          line_item_id: li.line_item_id != null ? String(li.line_item_id) : undefined,
          sku: li.sku != null ? String(li.sku) : undefined,
          name: li.name != null ? String(li.name) : undefined,
          description: li.description != null ? String(li.description) : undefined,
          unit: li.unit != null ? String(li.unit) : undefined,
          quantity: Number.isFinite(qty as number) ? (qty as number) : undefined,
          rate,
          item_total: typeof li.item_total === 'number' ? li.item_total : undefined,
          item_total_inclusive_of_tax:
            typeof li.item_total_inclusive_of_tax === 'number'
              ? li.item_total_inclusive_of_tax
              : undefined,
          item_order: typeof li.item_order === 'number' ? li.item_order : undefined,
        }
      })
    : undefined

  const billing_address = firstAddressBlock(inv.billing_address)
  let delivery_address = firstAddressBlock(inv.delivery_address)
  if (delivery_address && typeof inv.attention === 'string' && inv.attention && !delivery_address.attention) {
    delivery_address = { ...delivery_address, attention: inv.attention }
  }

  const contact_persons_associated = Array.isArray(inv.contact_persons_associated)
    ? (inv.contact_persons_associated as ZohoPurchaseOrderPayload['contact_persons_associated'])
    : undefined

  return {
    purchaseorder_id:
      inv.purchaseorder_id != null ? String(inv.purchaseorder_id) : undefined,
    purchaseorder_number:
      inv.purchaseorder_number != null ? String(inv.purchaseorder_number) : undefined,
    date: inv.date != null ? String(inv.date) : undefined,
    reference_number:
      inv.reference_number != null ? String(inv.reference_number) : undefined,
    vendor_name: inv.vendor_name != null ? String(inv.vendor_name) : undefined,
    gst_no: inv.gst_no != null ? String(inv.gst_no) : undefined,
    currency_code: inv.currency_code != null ? String(inv.currency_code) : undefined,
    sub_total: typeof inv.sub_total === 'number' ? inv.sub_total : undefined,
    total: typeof inv.total === 'number' ? inv.total : undefined,
    tax_total: typeof inv.tax_total === 'number' ? inv.tax_total : undefined,
    notes: inv.notes != null ? String(inv.notes) : undefined,
    terms: inv.terms != null ? String(inv.terms) : undefined,
    ship_via: inv.ship_via != null ? String(inv.ship_via) : undefined,
    is_inclusive_tax: inv.is_inclusive_tax === true,
    price_precision: typeof inv.price_precision === 'number' ? inv.price_precision : undefined,
    line_items,
    billing_address,
    delivery_address,
    contact_persons_associated,
    custom_fields: Array.isArray(inv.custom_fields)
      ? (inv.custom_fields as ZohoPurchaseOrderPayload['custom_fields'])
      : undefined,
    custom_field_hash:
      inv.custom_field_hash != null && typeof inv.custom_field_hash === 'object'
        ? (inv.custom_field_hash as ZohoPurchaseOrderPayload['custom_field_hash'])
        : undefined,
  }
}

/** OAuth scopes for browser consent (Inventory PO GET + org/settings). */
export const ZOHO_INVENTORY_OAUTH_SCOPES_RECOMMENDED =
  'ZohoInventory.purchaseorders.READ,ZohoInventory.settings.READ'

export function getConfiguredZohoInventoryApiRoot(): string {
  return inventoryApiRoot()
}

export function getZohoAccountsOAuthBaseUrlForInventory(): string {
  return accountsOAuthBaseFromApiRoot(inventoryApiRoot())
}

export function getZohoApiConsoleBaseUrlForInventory(): string {
  return apiConsoleBaseFromApiRoot(inventoryApiRoot())
}

/**
 * Zoho Inventory purchase order (same org id as Books when linked).
 * Response key is `purchase_order`, not Books' `purchaseorder`.
 */
export async function fetchPurchaseOrderFromZohoInventory(
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
  const root = inventoryApiRoot()
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

  if (json.code !== 0 || !json.purchase_order) {
    throw formatZohoBooksFailure(res, json, rawText)
  }

  const payload = normalizeInventoryPurchaseOrder(json.purchase_order)
  return {
    viewModel: mapZohoPurchaseOrderPayload(payload),
    zohoApiResponse: json,
  }
}
