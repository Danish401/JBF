/** Derive Zoho Accounts / API Console hosts from any zohoapis.* API root. */
export function accountsOAuthBaseFromApiRoot(apiRoot: string): string {
  const r = apiRoot.toLowerCase()
  if (r.includes('zohoapis.in')) return 'https://accounts.zoho.in'
  if (r.includes('zohoapis.eu')) return 'https://accounts.zoho.eu'
  if (r.includes('zohoapis.com.au')) return 'https://accounts.zoho.com.au'
  if (r.includes('zohoapis.jp')) return 'https://accounts.zoho.jp'
  return 'https://accounts.zoho.com'
}

export function apiConsoleBaseFromApiRoot(apiRoot: string): string {
  const r = apiRoot.toLowerCase()
  if (r.includes('zohoapis.in')) return 'https://api-console.zoho.in'
  if (r.includes('zohoapis.eu')) return 'https://api-console.zoho.eu'
  if (r.includes('zohoapis.com.au')) return 'https://api-console.zoho.com.au'
  if (r.includes('zohoapis.jp')) return 'https://api-console.zoho.jp'
  return 'https://api-console.zoho.com'
}
