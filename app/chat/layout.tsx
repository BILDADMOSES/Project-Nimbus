import { SessionProvider } from "next-auth/react"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <SessionProvider>
        {children}
      </SessionProvider>
    </html>
  )
}