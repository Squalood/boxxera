import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOXXERA — El padrón oficial del boxeo profesional",
  description: "Boxeadores verificados, récord real, respaldo institucional — el boxeo profesional de la frontera, en un solo lugar."
};

// Both fonts are loaded with next/font/google, which downloads and self-hosts
// them at build time. That removes the runtime request to fonts.googleapis.com
// and the flash of unstyled text that came with the previous <link> approach.
// Trade-off to keep in mind: next/font needs network access to Google Fonts
// DURING THE BUILD. If a CI environment ever blocks it, the build fails — in
// that case, revert to <link> tags in <head> and drop the `variable` wiring.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
