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
  title: 'SPeanut',
  description: 'Ứng dụng quản lý lương trợ giảng và lịch làm việc.',
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
