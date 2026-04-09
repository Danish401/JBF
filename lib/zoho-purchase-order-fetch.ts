import {
  PurchaseOrderFetchError,
  ZOHO_BOOKS_OAUTH_SCOPES_RECOMMENDED,
  fetchPurchaseOrderFromZohoBooks,
  getConfiguredZohoBooksApiRoot,
  type PurchaseOrderZohoApiFetchResult,
} from '@/lib/zoho-books-purchase-order'
import {
  ZOHO_INVENTORY_OAUTH_SCOPES_RECOMMENDED,
  fetchPurchaseOrderFromZohoInventory,
  getConfiguredZohoInventoryApiRoot,
} from '@/lib/zoho-inventory-purchase-order'
import {
  accountsOAuthBaseFromApiRoot,
  apiConsoleBaseFromApiRoot,
} from '@/lib/zoho-regional-urls'

export type PurchaseOrderZohoFetchResult = PurchaseOrderZohoApiFetchResult

export type PurchaseOrderZohoSource = 'books' | 'inventory'

export function getZohoPurchaseOrderSource(): PurchaseOrderZohoSource {
  const s = process.env.ZOHO_PURCHASE_ORDER_SOURCE?.trim().toLowerCase()
  return s === 'inventory' ? 'inventory' : 'books'
}

export async function fetchPurchaseOrderFromZoho(id: string): Promise<PurchaseOrderZohoApiFetchResult> {
  if (getZohoPurchaseOrderSource() === 'inventory') {
    return fetchPurchaseOrderFromZohoInventory(id)
  }
  return fetchPurchaseOrderFromZohoBooks(id)
}

export function getActiveZohoPoApiRootForHints(): string {
  return getZohoPurchaseOrderSource() === 'inventory'
    ? getConfiguredZohoInventoryApiRoot()
    : getConfiguredZohoBooksApiRoot()
}

export function getZohoAccountsOAuthBaseUrlForActivePoSource(): string {
  return accountsOAuthBaseFromApiRoot(getActiveZohoPoApiRootForHints())
}

export function getZohoApiConsoleBaseUrlForActivePoSource(): string {
  return apiConsoleBaseFromApiRoot(getActiveZohoPoApiRootForHints())
}

export function getRecommendedZohoPoOAuthScopes(): string {
  return getZohoPurchaseOrderSource() === 'inventory'
    ? ZOHO_INVENTORY_OAUTH_SCOPES_RECOMMENDED
    : ZOHO_BOOKS_OAUTH_SCOPES_RECOMMENDED
}

export {
  PurchaseOrderFetchError,
  ZOHO_BOOKS_OAUTH_SCOPES_RECOMMENDED,
  ZOHO_INVENTORY_OAUTH_SCOPES_RECOMMENDED,
}
