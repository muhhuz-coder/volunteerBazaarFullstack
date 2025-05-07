import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Import Geist Sans
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider
import { ChatbotWidget } from '@/components/chatbot-widget'; // Import ChatbotWidget

// No need for Inter anymore if GeistSans is primary

export const metadata: Metadata = {
  // Updated title and description
  title: 'VolunteerBazaar',
  description: 'Find volunteer opportunities or recruit volunteers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply GeistSans variable to the html tag
    <html lang="en" className={`${GeistSans.variable}`}>
      {/* Body will inherit the font family from globals.css */}
      <body className={`antialiased`}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {/* Apply fade-in animation to main content area */}
          <main className="min-h-screen flex flex-col page-fade-in">
            {children}
          </main>
          <Toaster /> {/* Add Toaster component */}
          <ChatbotWidget /> {/* Add ChatbotWidget here for global fixed positioning */}
        </AuthProvider>
      </body>
    </html>
  );
}
