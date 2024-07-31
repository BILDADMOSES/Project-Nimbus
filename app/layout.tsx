import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import TranslateScriptLoader from '@/components/language/TranslateScriptLoader';
import SessionProviderWrapper from './SessionProviderWrapper';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "chatEasy",
  description: "Communicate. Collaborate. Connect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body data-theme="light" className={inter.className}>
        <SessionProviderWrapper>
          <Toaster position="top-right" />
          <TranslateScriptLoader />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}