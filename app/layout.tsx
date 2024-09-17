import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import toast, { Toaster } from 'react-hot-toast';


const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <div className="bg-wallpaper"></div>
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        <SessionProvider session={session}>
          <div>{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
