import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Building Mind Map",
  description: "Create, drag, and organize idea maps from any device.",
  applicationName: "Building Mind Map",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mind Map",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f4ec",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
