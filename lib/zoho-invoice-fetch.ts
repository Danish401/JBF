export {
  InvoiceFetchError,
  ZOHO_BOOKS_OAUTH_SCOPES_INVOICES_ONLY,
  ZOHO_BOOKS_OAUTH_SCOPES_INVOICES_RECOMMENDED,
  fetchInvoiceFromZohoBooks,
  getConfiguredZohoBooksApiRootForInvoices,
  getZohoAccountsOAuthBaseUrlForInvoices,
  getZohoApiConsoleBaseUrlForInvoices,
  type InvoiceZohoApiFetchResult,
} from '@/lib/zoho-books-invoice'

import { fetchInvoiceFromZohoBooks } from '@/lib/zoho-books-invoice'

/** Loads a Zoho Books invoice by internal id (same OAuth token as purchase orders). */
export async function fetchInvoiceFromZoho(invoiceId: string) {
  return fetchInvoiceFromZohoBooks(invoiceId)
}
