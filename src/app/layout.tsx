import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Real Estates",
  description: "Find your next property",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              RealEstates
            </a>
            <nav className="flex gap-6 text-sm font-medium">
              <a href="/" className="hover:text-blue-600 transition-colors">
                Listings
              </a>
              <a
                href="/properties/new"
                className="hover:text-blue-600 transition-colors"
              >
                Add Property
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 py-6">
          &copy; {new Date().getFullYear()} RealEstates
        </footer>
      </body>
    </html>
  );
}
