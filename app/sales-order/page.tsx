import type { Metadata } from 'next'
import Link from 'next/link'
import SalesOrder from '@/app/components/SalesOrder'
import SalesOrderPrintButton from '@/app/components/SalesOrderPrintButton'

export const metadata: Metadata = {
  title: 'Sales Order - JBF Bahrain',
  description: 'Sales order document template (print/PDF).',
}

export default function SalesOrderPage() {
  return (
    <main
      className="sales-order-print-root"
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
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        <strong>Sales order template.</strong> Static sample below. To load a live document from Zoho Books, set{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          ZOHO_ORGANIZATION_ID
        </code>{' '}
        (e.g. <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>10234695</code>) and OAuth
        env vars like the purchase order, ensure your refresh token includes{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          ZohoBooks.salesorders.READ
        </code>
        , then open{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          /sales-order/&lt;salesorder_id&gt;
        </code>{' '}
        (example id:{' '}
        <Link href="/sales-order/460000000039129" style={{ color: '#166534' }}>
          460000000039129
        </Link>
        ). In <strong>development</strong>, the browser console logs{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>[SO debug]</code> with raw JSON
        and the mapped view model.{' '}
        <Link href="/purchase-order" style={{ color: '#166534' }}>
          Purchase order
        </Link>
        {' · '}
        <Link href="/" style={{ color: '#166534' }}>
          Home
        </Link>
      </p>
      <SalesOrderPrintButton />
      <SalesOrder />
    </main>
  )
}
