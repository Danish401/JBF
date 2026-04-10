'use client'

import { useEffect } from 'react'
import type { ZohoSoApiJson } from '@/lib/zoho-books-sales-order'
import type { SalesOrderViewModel } from '@/lib/sales-order-view-model'

export interface SalesOrderConsoleLoggerProps {
  zohoId: string
  data: SalesOrderViewModel
  zohoApiResponse: ZohoSoApiJson
}

/**
 * In development, logs the raw Zoho JSON and mapped view model to the browser console
 * so you can verify field mapping. Filter console by `[SO debug]`.
 */
export default function SalesOrderConsoleLogger({
  zohoId,
  data,
  zohoApiResponse,
}: SalesOrderConsoleLoggerProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    console.log('[SO debug] Zoho sales order id:', zohoId)
    console.log('[SO debug] GET …/salesorders/{id} response body:', zohoApiResponse)
    console.log('[SO debug] Mapped SalesOrderViewModel:', data)
  }, [zohoId, data, zohoApiResponse])

  return null
}
