import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  metadataBase: new URL('https://s-peanut.vercel.app'),
  title: 'SPeanut',
  description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
  keywords: ['SPeanut', 'quản lý lương', 'trợ giảng', 'lịch làm việc', 'bảng lương', 'tính lương trợ giảng'],
  manifest: '/manifest.json',
  icons: {
    // Favicon trên tab browser → giữ peanut.png cũ
    icon: [
      { url: '/peanut.png', type: 'image/png' },
    ],
    shortcut: '/peanut.png',
    // Icon lưu lên màn hình điện thoại (iOS) → dùng icon mới
    apple: [
      { url: '/icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'SPeanut',
    description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
    url: 'https://s-peanut.vercel.app',
    siteName: 'SPeanut',
    images: [
      {
        url: 'https://s-peanut.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SPeanut Logo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPeanut',
    description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
    images: ['https://s-peanut.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* ===== Favicon - Tab browser: giữ peanut.png cũ ===== */}
        <link rel="icon" type="image/png" href="/peanut.png" />
        <link rel="shortcut icon" href="/peanut.png" />
        {/* ===== Apple Touch Icons - Lưu lên màn hình điện thoại iOS ===== */}
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        {/* Android/PWA icons được handle qua manifest.json - KHÔNG dùng rel="icon" ở đây */}
        {/* Windows Tile */}
        <meta name="msapplication-TileImage" content="/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#735BF2" />
        {/* PWA Meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SPeanut" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://s-peanut.vercel.app" />
        <meta property="og:title" content="SPeanut" />
        <meta property="og:description" content="Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut." />
        <meta property="og:image" content="https://s-peanut.vercel.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://s-peanut.vercel.app" />
        <meta name="twitter:title" content="SPeanut" />
        <meta name="twitter:description" content="Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut." />
        <meta name="twitter:image" content="https://s-peanut.vercel.app/og-image.png" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="app-body min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
