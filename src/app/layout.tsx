import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { QueryProvider } from '@/providers/query-provider';
import { AppHeader } from '@/components/AppHeader';
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
  title: '8020 - Master Any Skill in 30 Days',
  description: 'Master any skill in 30 days using the 80/20 principle and Tim Ferriss method',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen`}>
          <QueryProvider>
            <AppHeader />
            <main className="pt-4">
              {children}
            </main>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
