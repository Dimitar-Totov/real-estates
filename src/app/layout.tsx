import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RealEstate — Find the right home at the right price",
  description: "Search homes for sale, apartments for rent, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <footer className="border-t border-gray-200 text-center text-sm text-gray-400 py-8 px-4 sm:px-6">
          &copy; {new Date().getFullYear()} RealEstate &mdash; All rights reserved
        </footer>
      </body>
    </html>
  );
}
