import type { Metadata } from "next";

const BASE_URL = "https://prepforall.com";

export function createMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: "PrepForAll -- Coding Practice & Placement Preparation Platform",
      template: "%s | PrepForAll",
    },
    description:
      "LeetCode-grade coding practice, timed assessments, and analytics for universities and training partners. 200+ DSA & SQL problems.",
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: BASE_URL,
      siteName: "PrepForAll",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PrepForAll" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@prepforall",
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}
