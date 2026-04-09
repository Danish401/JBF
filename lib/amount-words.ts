const UNDER_20 = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function wordsUnder1000(n: number): string {
  if (n < 20) return UNDER_20[n]
  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? TENS[t]! : `${TENS[t]!}-${UNDER_20[u]!}`
  }
  const h = Math.floor(n / 100)
  const rest = n % 100
  if (rest === 0) return `${UNDER_20[h]!} hundred`
  return `${UNDER_20[h]!} hundred ${wordsUnder1000(rest)}`
}

function positiveIntToWords(n: number): string {
  if (n === 0) return 'zero'
  const parts: string[] = []
  let remaining = n
  const scales = [
    { v: 1_000_000_000, w: 'billion' },
    { v: 1_000_000, w: 'million' },
    { v: 1_000, w: 'thousand' },
    { v: 1, w: '' },
  ]
  for (const { v, w } of scales) {
    if (remaining >= v) {
      const chunk = Math.floor(remaining / v)
      remaining %= v
      const chunkWords = wordsUnder1000(chunk)
      parts.push(w ? `${chunkWords} ${w}` : chunkWords)
    }
  }
  return parts.join(' ')
}

function toInvoiceUpperWords(n: number): string {
  const words = positiveIntToWords(Math.max(0, Math.floor(n)))
  return words
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/-/g, ' ')
}

/** Integer part in UPPERCASE WORDS + currency + ONLY (matches printed PO style). */
export function amountToWordsIntegerOnly(amount: number, currencyCode: string): string {
  const intPart = Math.floor(Math.max(0, amount))
  return `${toInvoiceUpperWords(intPart)} ${currencyCode} Only`
}

/**
 * Commercial invoice style: "USD THIRTY FOUR THOUSAND ... AND TWENTY SIX CENTS ONLY".
 * Hyphens in compound numbers are expanded to spaces (e.g. TWENTY SIX).
 */
export function usdAmountToCommercialInvoiceWords(amount: number): string {
  const safe = Math.max(0, amount)
  const dollars = Math.floor(safe)
  const cents = Math.min(99, Math.round((safe - dollars) * 100 + 1e-9))
  const dollarPart = toInvoiceUpperWords(dollars)
  if (cents === 0) {
    return `USD ${dollarPart} ONLY`
  }
  const centPart = toInvoiceUpperWords(cents)
  return `USD ${dollarPart} AND ${centPart} CENTS ONLY`
}
