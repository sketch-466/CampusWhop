import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "CampusWhop — The Student Economy",
    template: "%s | CampusWhop",
  },
  description:
    "Buy, sell, find jobs, and build your reputation at FUNAI. CampusWhop is the economic operating system for Nigerian students.",
  keywords: ["FUNAI", "student marketplace", "campus jobs", "Nigeria", "student economy"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        {children}
      </body>
    </html>
  );
}
