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
  title: 'SPeanut - Quản lý Lương & Lịch làm việc Trợ giảng',
  description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
  keywords: ['SPeanut', 'quản lý lương', 'trợ giảng', 'lịch làm việc', 'bảng lương', 'tính lương trợ giảng'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/peanut.png',
        type: 'image/png', // Định nghĩa rõ ràng loại file ảnh
      }
    ],
    shortcut: '/peanut.png',
    apple: '/peanut.png',
  },
  openGraph: {
    title: 'SPeanut - Quản lý Lương & Lịch làm việc Trợ giảng',
    description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
    url: 'https://speanut.com',
    siteName: 'SPeanut',
    images: [
      {
        url: '/peanut.png',
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
    title: 'SPeanut - Quản lý Lương & Lịch làm việc Trợ giảng',
    description: 'Hệ thống quản lý thù lao và lịch làm việc thông minh dành cho trợ giảng SPeanut.',
    images: ['/peanut.png'],
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
