import type { Metadata, Viewport } from 'next';
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


// ===== Viewport: Fix màn hình mobile, không bị zoom/kéo tùm lum =====
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,        // Khoá zoom bằng gesture (pinch-to-zoom)
  userScalable: false,    // Tắt hoàn toàn user zoom
  viewportFit: 'cover',   // Tận dụng toàn bộ màn hình kể cả safe area (notch, home bar)
  interactiveWidget: 'resizes-content', // Bàn phím ảo không đẩy layout lên
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://s-peanut.vercel.app'),
  title: 'SPeanut - Hệ Thống Quản Lý Lương & Lịch Làm Trợ Giảng',
  description: 'Hệ thống phần mềm quản lý thù lao, tính lương và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
  keywords: [
    // Thương hiệu & các cách gõ
    'SPeanut',
    'speanut',
    's peanut',
    's-peanut',
    'speanut app',
    'speanut vercel',
    // Trợ giảng & Quản lý
    'trợ giảng',
    'tro giang',
    'quản lý trợ giảng',
    'quan ly tro giang',
    'app trợ giảng',
    'trợ giảng tiếng anh',
    // Lương & Thù lao
    'quản lý lương',
    'quan ly luong',
    'tính lương trợ giảng',
    'tinh luong tro giang',
    'bảng lương trợ giảng',
    'bang luong tro giang',
    'tính thù lao',
    'quản lý thù lao',
    'tính lương ca dạy',
    'tính lương theo giờ',
    // Lịch làm & Điểm danh
    'lịch làm việc',
    'lich lam viec',
    'quản lý lịch dạy',
    'quan ly lich day',
    'lịch trợ giảng',
    'xếp lịch dạy',
    'điểm danh trợ giảng',
    // Phần mềm & Công cụ
    'phần mềm quản lý trợ giảng',
    'công cụ tính lương trợ giảng',
    'hệ thống quản lý trợ giảng',
  ],
  alternates: {
    canonical: 'https://s-peanut.vercel.app',
  },
  verification: {
    google: 'iKSo11LSHwVvfo3_xI0-jJ3b9uF1Lwl-Y9S1hX0Doks',
  },
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
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="iKSo11LSHwVvfo3_xI0-jJ3b9uF1Lwl-Y9S1hX0Doks" />
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

        {/* Structured Data (Schema.org JSON-LD) cho Google hiểu ứng dụng */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://s-peanut.vercel.app/#website',
                  url: 'https://s-peanut.vercel.app',
                  name: 'SPeanut',
                  alternateName: ['speanut', 's peanut', 's-peanut', 'SPeanut App'],
                  description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
                  inLanguage: 'vi-VN',
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://s-peanut.vercel.app/#application',
                  name: 'SPeanut',
                  alternateName: 'SPeanut - Quản lý lương & lịch làm trợ giảng',
                  operatingSystem: 'All',
                  applicationCategory: 'BusinessApplication',
                  url: 'https://s-peanut.vercel.app',
                  description: 'Phần mềm và ứng dụng quản lý lương, thù lao, lịch dạy và ca làm cho trợ giảng SPeanut.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'VND',
                  },
                },
              ],
            }),
          }}
        />

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
