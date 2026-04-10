import type { Metadata } from 'next'
import Link from 'next/link'
import SalesOrder from '@/app/components/SalesOrder'
import SalesOrderPrintButton from '@/app/components/SalesOrderPrintButton'
import SalesOrderConsoleLogger from '@/app/components/SalesOrderConsoleLogger'
import {
  SalesOrderFetchError,
  ZOHO_BOOKS_OAUTH_SCOPES_SALESORDERS_READ,
  fetchSalesOrderFromZohoBooks,
  getConfiguredZohoBooksApiRootForSalesOrder,
  getZohoAccountsOAuthBaseUrlForSalesOrder,
  getZohoApiConsoleBaseUrlForSalesOrder,
} from '@/lib/zoho-sales-order-fetch'

type PageProps = {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Sales Order ${params.id} - JBF Bahrain`,
    description: 'Sales order document',
  }
}

function codeStyle(text: string) {
  return (
    <code style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' }}>
      {text}
    </code>
  )
}

export default async function SalesOrderByIdPage({ params }: PageProps) {
  let errorMessage: string | null = null
  let soError: SalesOrderFetchError | null = null

  try {
    const { viewModel, zohoApiResponse } = await fetchSalesOrderFromZohoBooks(params.id)
    return (
      <main
        className="sales-order-print-root"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '24px 16px',
        }}
      >
        <SalesOrderConsoleLogger zohoId={params.id} data={viewModel} zohoApiResponse={zohoApiResponse} />
        <SalesOrderPrintButton />
        <SalesOrder data={viewModel} />
      </main>
    )
  } catch (err) {
    if (err instanceof SalesOrderFetchError) {
      soError = err
      errorMessage = err.message
    } else if (err instanceof Error) {
      errorMessage = err.message
    } else {
      errorMessage = 'Failed to load sales order.'
    }
  }

  const showAuthHelp = soError?.isLikelyAuthorizationOrScopeIssue ?? false
  const booksRoot = getConfiguredZohoBooksApiRootForSalesOrder()
  const accountsBase = getZohoAccountsOAuthBaseUrlForSalesOrder()
  const consoleBase = getZohoApiConsoleBaseUrlForSalesOrder()
  const recommendedScope = ZOHO_BOOKS_OAUTH_SCOPES_SALESORDERS_READ

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
      <h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Sales order could not be loaded</h1>
      <p style={{ color: '#1a1a1a', marginBottom: '16px', lineHeight: 1.5 }}>{errorMessage}</p>

      <section
        style={{
          marginBottom: '20px',
          padding: '14px 16px',
          background: '#ecfdf5',
          border: '1px solid #6ee7b7',
          borderRadius: '8px',
          lineHeight: 1.6,
          fontSize: '13px',
        }}
      >
        <strong>Zoho Books API.</strong> Same OAuth token as purchase order ({codeStyle('ZOHO_REFRESH_TOKEN')},
        etc.). Set {codeStyle('ZOHO_ORGANIZATION_ID')} (or {codeStyle('ZOHO_BOOKS_ORGANIZATION_ID')}) to your org id
        (e.g. {codeStyle('10234695')}), then restart the dev server. Open{' '}
        {codeStyle(`/sales-order/${params.id}`)} after the token includes {codeStyle('ZohoBooks.salesorders.READ')}.
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
            Fix: “not authorized” (code 57) — missing Books scopes
          </h2>
          <p style={{ marginBottom: '12px' }}>
            Regenerate {codeStyle('ZOHO_REFRESH_TOKEN')} with scopes that include{' '}
            <strong>Zoho Books sales orders</strong> (see recommended scope below).
          </p>
          <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '8px' }}>
              In{' '}
              <a href={`${consoleBase}/`} target="_blank" rel="noreferrer" style={{ color: '#166534' }}>
                Zoho API Console
              </a>
              , open your Server-based client.
            </li>
            <li style={{ marginBottom: '8px' }}>Use this OAuth URL pattern (replace placeholders):</li>
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

      <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>Test with curl</h2>
      <pre
        style={{
          fontSize: '11px',
          overflow: 'auto',
          padding: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          marginBottom: '20px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {`curl --request GET \\
  --url '${booksRoot}/salesorders/${params.id}?organization_id=YOUR_ORG_ID' \\
  --header 'Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN'`}
      </pre>

      <ul style={{ marginBottom: '20px', paddingLeft: '20px', lineHeight: 1.6 }}>
        <li>
          API base: {codeStyle(booksRoot)} — must match your Zoho data center.
        </li>
        <li>
          Sales order id in the URL is Zoho’s internal id (long numeric), e.g. {codeStyle('460000000039129')}.
        </li>
      </ul>
      <Link href="/sales-order" style={{ color: '#166534' }}>
        ← Back to sample sales order
      </Link>
    </main>
  )
}
