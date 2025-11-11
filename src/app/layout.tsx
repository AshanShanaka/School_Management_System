import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: " School Management Dashboard",
  description: "Next.js School Management System",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          containerStyle={{
            top: 16, // Position from top to match navbar height
            right: 16, // Position from right to match navbar padding
            zIndex: 9999, // Ensure it's above everything
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              duration: 2500, // Perfect timing for login success
              style: {
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "1px solid #047857",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4), 0 4px 10px rgba(0, 0, 0, 0.1)",
                minWidth: "320px",
                maxWidth: "400px",
              },
              iconTheme: {
                primary: "#ffffff",
                secondary: "#10b981",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
