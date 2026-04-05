import type { Metadata } from "next";
import { dmSans, inter, jetbrainsMono } from "@/lib/fonts";
import { createMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = createMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PrepForAll",
              url: "https://prepforall.com",
              logo: "https://prepforall.com/images/logo.svg",
              description:
                "LeetCode-grade coding practice and placement preparation platform for universities.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "hello@prepforall.com",
                contactType: "sales",
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
