import type { Metadata } from "next";
import "./globals.css";
import "@xterm/xterm/css/xterm.css";

export const metadata: Metadata = { title: "Arra / Common Ground · Oracle Field Atlas", description: "A living Oracle town: real MAW / Herdr activity, read-only terminal previews, simulated homes and community" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
