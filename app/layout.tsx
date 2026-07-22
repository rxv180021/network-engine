import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Network Engine — The Verified Referral Graph",
  description:
    "The verified referral graph. Members earn Gold by proving a real referral; every outcome is tracked into an auditable SROI ledger.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
