import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "cvs-frontend",
  description: "A simple frontend application for the grype PoC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
