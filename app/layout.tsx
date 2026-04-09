import type { Metadata } from 'next'
import './globals.css'
import ZohoTokenLoader from './components/ZohoTokenLoader'

export const metadata: Metadata = {
  title: 'JBF Bahrain',
  description: 'Purchase order',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ZohoTokenLoader />
        {children}
      </body>
    </html>
  )
}
