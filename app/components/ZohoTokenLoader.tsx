'use client'

import { useEffect } from 'react'

/**
 * Prefetches Zoho access token on load (uses /api/zoho-token → lib/zoho refresh flow).
 */
export default function ZohoTokenLoader() {
  useEffect(() => {
    fetch('/api/zoho-token')
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          console.log('Zoho access_token:', data.access_token)
          console.log('Zoho token response:', data)
        } else {
          console.error('Zoho token error:', data)
        }
      })
      .catch((err) => console.error('Zoho token fetch failed:', err))
  }, [])

  return null
}
