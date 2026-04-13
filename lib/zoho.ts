/**
 * Zoho OAuth access token (server-side only).
 *
 * Uses POST `ZOHO_OAUTH_TOKEN_URL` (default https://accounts.zoho.com/oauth/v2/token) with
 * `Content-Type: application/x-www-form-urlencoded` and body:
 *   refresh_token=<ZOHO_REFRESH_TOKEN>&client_id=<ZOHO_CLIENT_ID>&client_secret=<ZOHO_CLIENT_SECRET>&grant_type=refresh_token
 *
 * Postman equivalent:
 *   POST {{ZOHO_OAUTH_TOKEN_URL}}
 *   Headers: Content-Type: application/x-www-form-urlencoded
 *   Body (x-www-form-urlencoded): refresh_token, client_id, client_secret, grant_type=refresh_token
 *
 * The access token is short-lived (~1h). It is cached in memory and refreshed before expiry
 * (see SAFETY_BUFFER_MS). The refresh token is read from env only — it is not regenerated here.
 */
const ZOHO_TOKEN_URL =
  process.env.ZOHO_OAUTH_TOKEN_URL?.trim() || 'https://accounts.zoho.com/oauth/v2/token'
const SAFETY_BUFFER_MS = 5 * 60 * 1000 // Refresh ~5 minutes before Zoho’s access_token expiry
const CRON_REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes for cron job

let cached: { access_token: string; expires_at: number } | null = null
let lastRefreshTime = 0
/** Single in-flight refresh so production traffic spikes do not parallel-post to Zoho. */
let inflightRefresh: Promise<string> | null = null

export function clearTokenCache(): void {
  cached = null
  lastRefreshTime = 0
  inflightRefresh = null
}

export function getLastRefreshTime(): number {
  return lastRefreshTime
}

export function shouldRefreshForCron(): boolean {
  const now = Date.now()
  return !lastRefreshTime || now - lastRefreshTime >= CRON_REFRESH_INTERVAL_MS
}

function readOAuthEnv(): { refreshToken: string; clientId: string; clientSecret: string } {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing Zoho env: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET')
  }
  return { refreshToken, clientId, clientSecret }
}

/**
 * POSTs to Zoho token URL and returns a new access_token. Updates in-memory cache.
 */
async function fetchAccessTokenFromZoho(): Promise<string> {
  const { refreshToken, clientId, clientSecret } = readOAuthEnv()

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })

  const res = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data: Record<string, unknown> = await res.json().catch(() => ({}))

  if (!res.ok) {
    cached = null
    throw new Error(`Zoho token error: ${JSON.stringify(data)}`)
  }

  const accessToken = typeof data.access_token === 'string' ? data.access_token : ''
  if (!accessToken) {
    cached = null
    throw new Error(`Zoho token response missing access_token: ${JSON.stringify(data)}`)
  }

  const expiresRaw = data.expires_in_sec ?? data.expires_in
  const expiresInSeconds =
    typeof expiresRaw === 'number' && expiresRaw > 0
      ? expiresRaw
      : typeof expiresRaw === 'string' && Number(expiresRaw) > 0
        ? Number(expiresRaw)
        : 3600

  const now = Date.now()
  const expiresInMs = expiresInSeconds * 1000

  cached = {
    access_token: accessToken,
    expires_at: now + expiresInMs - SAFETY_BUFFER_MS,
  }
  lastRefreshTime = now

  return accessToken
}

/**
 * Returns a valid Zoho access token, using the cached one until shortly before Zoho’s expiry,
 * then POSTing again with the same refresh_token (same behavior in dev and production).
 *
 * @param forceRefresh - If true, skips cache and always calls Zoho (used by cron).
 */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now()

  if (!forceRefresh && cached && cached.expires_at > now) {
    return cached.access_token
  }

  if (forceRefresh) {
    cached = null
    inflightRefresh = null
  } else if (cached && cached.expires_at <= now) {
    cached = null
  }

  if (!forceRefresh && inflightRefresh) {
    return inflightRefresh
  }

  const refreshPromise = fetchAccessTokenFromZoho().finally(() => {
    if (inflightRefresh === refreshPromise) {
      inflightRefresh = null
    }
  })
  inflightRefresh = refreshPromise
  return refreshPromise
}
