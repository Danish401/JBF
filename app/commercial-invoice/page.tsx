import type { Metadata } from 'next'
import Link from 'next/link'
import CommercialInvoice from '@/app/components/CommercialInvoice'
import CommercialInvoicePrintButton from '@/app/components/CommercialInvoicePrintButton'

export const metadata: Metadata = {
  title: 'Commercial Invoice - JBF Bahrain',
  description:
    'Commercial invoice (sample). Load live data from Zoho Books at /commercial-invoice/{invoice_id}.',
}

export default function CommercialInvoicePage() {
  return (
    <main
      className="commercial-invoice-print-root"
      style={{
        maxWidth: '900px',
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
        <strong>Commercial invoice template.</strong> Sample:{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>/commercial-invoice</code>
        . Live Zoho Books:{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          /commercial-invoice/&lt;invoice_id&gt;
        </code>{' '}
        (internal id from Books). Add OAuth scope{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
          ZohoBooks.invoices.READ
        </code>{' '}
        with your PO scopes.{' '}
        <Link href="/purchase-order" style={{ color: '#166534' }}>
          Purchase order
        </Link>
        {' · '}
        <Link href="/" style={{ color: '#166534' }}>
          Home
        </Link>
      </p>
      <CommercialInvoicePrintButton />
      <CommercialInvoice />
    </main>
  )
}
