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
  metadataBase: new URL('https://speanut.com'),
  title: 'SPeanut',
  description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
  keywords: ['SPeanut', 'quản lý lương', 'trợ giảng', 'lịch làm việc', 'bảng lương', 'tính lương trợ giảng'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: 'https://speanut.com/peanut.png',
        type: 'image/png', // Định nghĩa rõ ràng loại file ảnh
      }
    ],
    shortcut: 'https://speanut.com/peanut.png',
    apple: 'https://speanut.com/peanut.png',
  },
  openGraph: {
    title: 'SPeanut',
    description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
    url: 'https://speanut.com',
    siteName: 'SPeanut',
    images: [
      {
        url: 'https://speanut.com/peanut.png',
        width: 512,
        height: 512,
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
    images: ['https://speanut.com/peanut.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://speanut.com" />
        <meta property="og:title" content="SPeanut" />
        <meta property="og:description" content="Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut." />
        <meta property="og:image" content="https://speanut.com/peanut.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://speanut.com" />
        <meta name="twitter:title" content="SPeanut" />
        <meta name="twitter:description" content="Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut." />
        <meta name="twitter:image" content="https://speanut.com/peanut.png" />

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
