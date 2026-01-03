import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { SessionProvider } from "@/components/providers/SessionProvider"

export const metadata: Metadata = {
  title: "Centro Dental - Geraldton's Trusted Family Dentist",
  description: "Quality dental care for patients both young and old. Book your appointment with Dr Chandy Koruthu and his team.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        <SessionProvider>
          <Navbar />
          <main className="min-h-screen bg-white relative">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}

