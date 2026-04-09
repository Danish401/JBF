import type { Metadata } from 'next'
import Link from 'next/link'
import PurchaseOrder from '@/app/components/PurchaseOrder'
import PurchaseOrderPrintButton from '@/app/components/PurchaseOrderPrintButton'

export const metadata: Metadata = {
  title: 'Purchase Order - JBF Bahrain',
  description: 'Purchase order document (sample). Load live data from Zoho Books at /purchase-order/{id}.',
}

export default function PurchaseOrderPage() {
  return (
    <main
      className="purchase-order-print-root"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <p
        className="no-print"
        style={{
          marginBottom: '16px',
          padding: '12px 14px',
          background: '#f0f7ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        <strong>Sample layout.</strong> To load a live PO, open{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          /purchase-order/&lt;purchaseorder_id&gt;
        </code>{' '}
        (internal id from Zoho). Set{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          ZOHO_ORGANIZATION_ID
        </code>{' '}
        (or <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>ZOHO_BOOKS_ORGANIZATION_ID</code>
        ). For POs in <strong>Zoho Inventory</strong>, add{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          ZOHO_PURCHASE_ORDER_SOURCE=inventory
        </code>{' '}
        in <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>.env</code>.{' '}
        <Link href="/" style={{ color: '#1e40af' }}>
          Home
        </Link>
      </p>
      <PurchaseOrderPrintButton />
      <PurchaseOrder />
    </main>
  )
}
