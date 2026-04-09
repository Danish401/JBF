import type { Metadata } from 'next'
import Link from 'next/link'
import PurchaseOrder from '@/app/components/PurchaseOrder'
import PurchaseOrderPrintButton from '@/app/components/PurchaseOrderPrintButton'
import PurchaseOrderConsoleLogger from '@/app/components/PurchaseOrderConsoleLogger'
import {
  PurchaseOrderFetchError,
  fetchPurchaseOrderFromZoho,
  getActiveZohoPoApiRootForHints,
  getRecommendedZohoPoOAuthScopes,
  getZohoAccountsOAuthBaseUrlForActivePoSource,
  getZohoApiConsoleBaseUrlForActivePoSource,
  getZohoPurchaseOrderSource,
} from '@/lib/zoho-purchase-order-fetch'

type PageProps = {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Purchase Order ${params.id} - JBF Bahrain`,
    description: 'Purchase order document',
  }
}

function codeStyle(text: string) {
  return (
    <code style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' }}>
      {text}
    </code>
  )
}

export default async function PurchaseOrderByIdPage({ params }: PageProps) {
  let errorMessage: string | null = null
  let poError: PurchaseOrderFetchError | null = null

  try {
    const { viewModel, zohoApiResponse } = await fetchPurchaseOrderFromZoho(params.id)
    return (
      <main
        className="purchase-order-print-root"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '24px 16px',
        }}
      >
        <PurchaseOrderConsoleLogger
          zohoId={params.id}
          data={viewModel}
          zohoApiResponse={zohoApiResponse}
        />
        <PurchaseOrderPrintButton />
        <PurchaseOrder data={viewModel} />
      </main>
    )
  } catch (err) {
    if (err instanceof PurchaseOrderFetchError) {
      poError = err
      errorMessage = err.message
    } else if (err instanceof Error) {
      errorMessage = err.message
    } else {
      errorMessage = 'Failed to load purchase order.'
    }
  }

  const source = getZohoPurchaseOrderSource()
  const showAuthHelp = poError?.isLikelyAuthorizationOrScopeIssue ?? false
  const booksRoot = getActiveZohoPoApiRootForHints()
  const accountsBase = getZohoAccountsOAuthBaseUrlForActivePoSource()
  const consoleBase = getZohoApiConsoleBaseUrlForActivePoSource()
  const recommendedScope = getRecommendedZohoPoOAuthScopes()

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
      <h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Purchase order could not be loaded</h1>
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
        <strong>Using {source === 'inventory' ? 'Zoho Inventory' : 'Zoho Books'} API.</strong> Switch with{' '}
        {codeStyle('ZOHO_PURCHASE_ORDER_SOURCE=books')} or {codeStyle('ZOHO_PURCHASE_ORDER_SOURCE=inventory')} in{' '}
        {codeStyle('.env')}, then restart the dev server. Purchase orders created in{' '}
        <strong>Inventory</strong> often return Zoho code <strong>57</strong> from the <strong>Books</strong> API even
        when OAuth is valid—use {codeStyle('inventory')} for those IDs.
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
            Fix: “not authorized” (code 57) — wrong product API or missing scopes
          </h2>
          <p style={{ marginBottom: '12px' }}>
            Regenerate {codeStyle('ZOHO_REFRESH_TOKEN')} with scopes for the API you selected ({source === 'inventory' ? (
              <strong>Zoho Inventory</strong>
            ) : (
              <strong>Zoho Books</strong>
            )}
            ). Books scopes do not grant Inventory APIs, and vice versa.
          </p>
          <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '8px' }}>
              In{' '}
              <a href={`${consoleBase}/`} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>
                Zoho API Console
              </a>{' '}
              ({codeStyle(consoleBase)}), open your <strong>Server-based</strong> client and a valid{' '}
              {codeStyle('redirect_uri')}.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Open this pattern (replace placeholders; URL-encode {codeStyle('redirect_uri')}). OAuth host must match
              your data center ({codeStyle(accountsBase)}):
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
            Recommended {codeStyle('scope')} for <strong>{source}</strong>: {codeStyle(recommendedScope)}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li>
              {codeStyle('access_type=offline')} and {codeStyle('prompt=consent')} are required for a refresh token.
            </li>
            <li>
              Exchange the {codeStyle('code')} (e.g. {codeStyle('node scripts/get-refresh-token.js')}) and update{' '}
              {codeStyle('.env')}.
            </li>
          </ul>
        </section>
      )}

      <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>Checklist</h2>
      <ul style={{ marginBottom: '20px', paddingLeft: '20px', lineHeight: 1.6 }}>
        <li>
          API base: {codeStyle(booksRoot)} — must match your Zoho data center (US/global Inventory:{' '}
          {codeStyle('https://www.zohoapis.com/inventory/v1')}; India:{' '}
          {codeStyle('https://www.zohoapis.in/inventory/v1')}).
        </li>
        <li>
          {codeStyle('ZOHO_ORGANIZATION_ID')} or {codeStyle('ZOHO_BOOKS_ORGANIZATION_ID')} must match your
          organization id in Zoho Books / Inventory (Settings). Restart after changing {codeStyle('.env')}.
        </li>
        <li>
          PO id in the URL must be Zoho’s internal purchase order id (long numeric), not your Zoho user id.
        </li>
      </ul>
      <Link href="/purchase-order" style={{ color: '#1e40af' }}>
        ← Back to sample purchase order
      </Link>
    </main>
  )
}
