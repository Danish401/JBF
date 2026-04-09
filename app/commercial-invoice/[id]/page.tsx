import type { Metadata } from 'next'
import Link from 'next/link'
import CommercialInvoice from '@/app/components/CommercialInvoice'
import CommercialInvoiceConsoleLogger from '@/app/components/CommercialInvoiceConsoleLogger'
import CommercialInvoicePrintButton from '@/app/components/CommercialInvoicePrintButton'
import {
  InvoiceFetchError,
  fetchInvoiceFromZoho,
  getConfiguredZohoBooksApiRootForInvoices,
  getZohoAccountsOAuthBaseUrlForInvoices,
  getZohoApiConsoleBaseUrlForInvoices,
  ZOHO_BOOKS_OAUTH_SCOPES_INVOICES_RECOMMENDED,
} from '@/lib/zoho-invoice-fetch'

type PageProps = {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Commercial Invoice ${params.id} - JBF Bahrain`,
    description: 'Commercial invoice from Zoho Books',
  }
}

function codeStyle(text: string) {
  return (
    <code style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' }}>
      {text}
    </code>
  )
}

export default async function CommercialInvoiceByIdPage({ params }: PageProps) {
  let errorMessage: string | null = null
  let invoiceError: InvoiceFetchError | null = null

  try {
    const { viewModel, zohoApiResponse } = await fetchInvoiceFromZoho(params.id)
    return (
      <main
        className="commercial-invoice-print-root"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '24px 16px',
        }}
      >
        <CommercialInvoiceConsoleLogger
          zohoId={params.id}
          data={viewModel}
          zohoApiResponse={zohoApiResponse}
        />
        <CommercialInvoicePrintButton />
        <CommercialInvoice data={viewModel} />
      </main>
    )
  } catch (err) {
    if (err instanceof InvoiceFetchError) {
      invoiceError = err
      errorMessage = err.message
    } else if (err instanceof Error) {
      errorMessage = err.message
    } else {
      errorMessage = 'Failed to load invoice.'
    }
  }

  const showAuthHelp = invoiceError?.isLikelyAuthorizationOrScopeIssue ?? false
  const booksRoot = getConfiguredZohoBooksApiRootForInvoices()
  const accountsBase = getZohoAccountsOAuthBaseUrlForInvoices()
  const consoleBase = getZohoApiConsoleBaseUrlForInvoices()
  const recommendedScope = ZOHO_BOOKS_OAUTH_SCOPES_INVOICES_RECOMMENDED

  const sampleAuthUrl = `${accountsBase}/oauth/v2/auth?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=${encodeURIComponent(recommendedScope)}&access_type=offline&prompt=consent`

  return (
    <main
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 16px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Commercial invoice could not be loaded</h1>
      <p style={{ color: '#1a1a1a', marginBottom: '16px', lineHeight: 1.5 }}>{errorMessage}</p>

      <section
        style={{
          marginBottom: '20px',
          padding: '14px 16px',
          background: '#e8f4fc',
          border: '1px solid #7eb8dc',
          borderRadius: '8px',
          lineHeight: 1.6,
          fontSize: '13px',
        }}
      >
        <strong>Zoho Books — Invoices API.</strong> This route loads{' '}
        {codeStyle('GET /books/v3/invoices/{invoice_id}')} using the same refresh token as purchase orders. Add{' '}
        {codeStyle('ZohoBooks.invoices.READ')} to your OAuth scopes if you only had purchase order scopes, then
        regenerate {codeStyle('ZOHO_REFRESH_TOKEN')}.
      </section>

      {showAuthHelp && (
        <section
          style={{
            marginBottom: '24px',
            padding: '16px 18px',
            background: '#fff8e6',
            border: '1px solid #f0d060',
            borderRadius: '8px',
            lineHeight: 1.65,
          }}
        >
          <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>
            Fix: “not authorized” (code 57) — missing invoice scopes
          </h2>
          <p style={{ marginBottom: '12px' }}>
            Regenerate {codeStyle('ZOHO_REFRESH_TOKEN')} with Books invoice read access (see recommended scope below).
          </p>
          <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '8px' }}>
              In{' '}
              <a href={`${consoleBase}/`} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>
                Zoho API Console
              </a>{' '}
              ({codeStyle(consoleBase)}), open your <strong>Server-based</strong> client.
            </li>
            <li style={{ marginBottom: '8px' }}>
              OAuth host must match your data center ({codeStyle(accountsBase)}).
            </li>
          </ol>
          <pre
            style={{
              fontSize: '11px',
              overflow: 'auto',
              padding: '12px',
              background: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              marginBottom: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {sampleAuthUrl}
          </pre>
          <p style={{ marginBottom: '8px' }}>
            Recommended {codeStyle('scope')}: {codeStyle(recommendedScope)}
          </p>
        </section>
      )}

      <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>Checklist</h2>
      <ul style={{ marginBottom: '20px', paddingLeft: '20px', lineHeight: 1.6 }}>
        <li>
          API base: {codeStyle(booksRoot)} — must match your Zoho data center.
        </li>
        <li>
          {codeStyle('ZOHO_ORGANIZATION_ID')} or {codeStyle('ZOHO_BOOKS_ORGANIZATION_ID')} must match Zoho Books
          (Settings → Organization Profile). Restart after changing {codeStyle('.env')}.
        </li>
        <li>
          Invoice id in the URL is Zoho’s internal invoice id (numeric), not the invoice number shown on the PDF.
        </li>
      </ul>
      <Link href="/commercial-invoice" style={{ color: '#166534' }}>
        ← Back to sample commercial invoice
      </Link>
    </main>
  )
}
