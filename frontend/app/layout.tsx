import type { Metadata, Viewport } from 'next'
import { Almarai } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const almarai = Almarai({ 
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai"
});

export const metadata: Metadata = {
  title: 'منصة العلومنجي | د. محمود سعيد',
  description: 'منصة تعليمية إلكترونية متخصصة للدكتور محمود سعيد — نظام متكامل لإدارة الكورسات والطلاب والمحتوى التعليمي',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#fe2c55',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${almarai.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}