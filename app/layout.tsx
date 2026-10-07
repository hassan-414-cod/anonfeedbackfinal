import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Anon-Feedback',
  description: 'Anonymous project feedback community',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-[#FDFCFB] text-[#1A1A1A] antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col items-center">
            <div className="w-full max-w-7xl flex-grow flex flex-col  min-h-full">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
