import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
