import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'cx_Freeze EXE Builder',
  description: 'Drag and drop Python to EXE builder using cx_Freeze',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
