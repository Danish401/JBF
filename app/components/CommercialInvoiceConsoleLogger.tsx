'use client'

import { useEffect } from 'react'
import type { ZohoInvoiceApiJson } from '@/lib/zoho-books-invoice'
import type { CommercialInvoiceViewModel } from '@/lib/commercial-invoice-view-model'

/** Set to the Zoho invoice id you want to inspect in DevTools → Console. */
const DEBUG_ZOHO_INVOICE_ID = ''

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
    if (!DEBUG_ZOHO_INVOICE_ID || zohoId !== DEBUG_ZOHO_INVOICE_ID) return
    console.log('[Invoice debug] Zoho invoice id:', zohoId)
    console.log('[Invoice debug] Full Zoho API JSON (GET invoices/{id}):', zohoApiResponse)
    console.log('[Invoice debug] View model (mapped for the template):', data)
  }, [zohoId, data, zohoApiResponse])

  return null
}
