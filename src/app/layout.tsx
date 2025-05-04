import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Switched to Inter for a cleaner sans-serif look
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans', // Keep variable name for compatibility if needed elsewhere
});

export const metadata: Metadata = {
  title: 'Job Board Lite', // Updated title
  description: 'Find your next job opportunity.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          <Toaster /> {/* Add Toaster component */}
        </AuthProvider>
      </body>
    </html>
  );
}
