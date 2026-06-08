import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Versa TV — AI Vertical Micro-Dramas",
  description:
    "Binge-worthy AI micro-dramas in your pocket. Swipe through cinematic vertical stories, chat with an AI host, remix in the studio, and discover creator channels — all powered by next-gen AI.",
  openGraph: {
    title: "Versa TV — AI Vertical Micro-Dramas",
    description:
      "Binge-worthy AI micro-dramas in your pocket. Swipe through cinematic vertical stories, chat with an AI host, remix in the studio, and discover creator channels.",
    type: "website",
    siteName: "Versa TV",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07070e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="phone-viewport text-ink">
        <div className="phone-device">
          <div className="phone-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
