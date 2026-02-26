"use client"

import type React from "react"
import { useState } from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { TRPCReactProvider } from "@/trpc/client"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY
  const [supabaseClient] = useState(() => createPagesBrowserClient(
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: supabaseKey!,
    }
  ));

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TRPCReactProvider>
          <SessionContextProvider supabaseClient={supabaseClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
            </ThemeProvider>
          </SessionContextProvider>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
