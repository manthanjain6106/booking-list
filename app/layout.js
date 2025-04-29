import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers'; // adjust path if needed

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'StayEase - Hotel Booking System',
  description: 'A web-based hotel booking application with real-time calendar and custom payment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-gray-50 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
