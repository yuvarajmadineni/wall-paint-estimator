import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wall Painting Cost Estimator",
  description: "Estimate wall painting cost from an uploaded image.",
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
