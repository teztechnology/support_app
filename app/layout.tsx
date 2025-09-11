import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StytchClientProvider } from "@/components/providers/stytch-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Support Ticket System",
  description: "Multi-tenant software support issue tracking application",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StytchClientProvider>{children}</StytchClientProvider>
      </body>
    </html>
  );
}
