import type { Metadata } from "next";
import localFont from "next/font/local";
import "./styles/index.css";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { PresenceProvider } from "./lib/presence";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Atlas — Master world geography, the fun way",
  description:
    "Find countries on a live map, race friends in 1v1, and explore every flag, capital and fact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <PresenceProvider>{children}</PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
