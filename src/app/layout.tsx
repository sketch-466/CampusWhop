import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusWhop — The Economic OS for Nigerian Students",
  description:
    "Buy, sell, find jobs and build your business. Safe escrow payments for Nigerian university students.",
  metadataBase: new URL("https://campuswhop.com"),
  openGraph: {
    title: "CampusWhop — The Economic OS for Nigerian Students",
    description: "Buy, sell, find jobs and build your business. Safe escrow payments for Nigerian university students.",
    url: "https://campuswhop.com",
    siteName: "CampusWhop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CampusWhop — The Economic OS for Nigerian Students",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusWhop — The Economic OS for Nigerian Students",
    description:
      "Buy, sell, find jobs, and build your business on the platform made for Nigerian university students.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "b7dc34b3-8b3c-49b6-9905-d334a7837c1f",
                  notifyButton: { enable: false },
                  allowLocalhostAsSecureOrigin: true,
                });
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}