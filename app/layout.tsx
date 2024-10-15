
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { headers } from "next/headers"; // added
import ContextProvider from '../context'

export const metadata: Metadata = {
  title: "Whoop Tourney",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookies = headers().get('cookie')

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}