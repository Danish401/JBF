'use client'

import { useEffect } from 'react'
import type { ZohoPoApiJson } from '@/lib/zoho-books-purchase-order'
import type { PurchaseOrderViewModel } from '@/lib/purchase-order-view-model'

/** Set to the Zoho PO id you want to inspect in DevTools → Console. */
const DEBUG_ZOHO_PO_ID = '8789489000000163180'

export interface PurchaseOrderConsoleLoggerProps {
  zohoId: string
  data: PurchaseOrderViewModel
  /** Parsed Zoho API body: Books uses `purchaseorder`; Inventory uses `purchase_order`. */
  zohoApiResponse: ZohoPoApiJson
}

export default function PurchaseOrderConsoleLogger({
  zohoId,
  data,
  zohoApiResponse,
}: PurchaseOrderConsoleLoggerProps) {
  useEffect(() => {
    if (zohoId !== DEBUG_ZOHO_PO_ID) return
    console.log('[PO debug] Zoho purchase order id:', zohoId)
    console.log('[PO debug] Full Zoho API JSON (as returned by GET purchaseorders/{id}):', zohoApiResponse)
    console.log('[PO debug] View model (mapped for the template):', data)
  }, [zohoId, data, zohoApiResponse])

  return null
}
