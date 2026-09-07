import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "CampusWhop — The Campus Economy",
    template: "%s | CampusWhop",
  },
  description: "Buy, sell, find jobs, and grow your business on campus. The economic operating system for Nigerian students.",
  metadataBase: new URL("https://campuswhop.com"),
  openGraph: {
    title: "CampusWhop — The Campus Economy",
    description: "Buy, sell, find jobs, and grow your business on campus.",
    url: "https://campuswhop.com",
    siteName: "CampusWhop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CampusWhop",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusWhop",
    description: "The economic operating system for Nigerian students.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}