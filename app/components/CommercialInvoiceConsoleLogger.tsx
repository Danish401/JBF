'use client'

import { useEffect } from 'react'
import type { ZohoInvoiceApiJson } from '@/lib/zoho-books-invoice'
import type { CommercialInvoiceViewModel } from '@/lib/commercial-invoice-view-model'

/**
 * Leave empty to log every invoice in dev. Set to a specific Zoho invoice id to limit noise.
 * Production builds skip logging unless NEXT_PUBLIC_LOG_ZOHO_INVOICE_API=true.
 */
const DEBUG_ZOHO_INVOICE_ID = ''

function shouldLogInvoiceApi(zohoId: string): boolean {
  const allowInProd = process.env.NEXT_PUBLIC_LOG_ZOHO_INVOICE_API === 'true'
  if (process.env.NODE_ENV !== 'development' && !allowInProd) return false
  if (DEBUG_ZOHO_INVOICE_ID && zohoId !== DEBUG_ZOHO_INVOICE_ID) return false
  return true
}

export interface CommercialInvoiceConsoleLoggerProps {
  zohoId: string
  data: CommercialInvoiceViewModel
  zohoApiResponse: ZohoInvoiceApiJson
}

export default function CommercialInvoiceConsoleLogger({
  zohoId,
  data,
  zohoApiResponse,
}: CommercialInvoiceConsoleLoggerProps) {
  useEffect(() => {
    if (!shouldLogInvoiceApi(zohoId)) return
    console.log('[Invoice debug] Zoho invoice id:', zohoId)
    console.log('[Invoice debug] Full Zoho API JSON (GET invoices/{id}):', zohoApiResponse)
    console.log('[Invoice debug] View model (mapped for the template):', data)
  }, [zohoId, data, zohoApiResponse])

  return null
}
