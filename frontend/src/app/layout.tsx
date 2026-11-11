import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SchoolAdmit — Online Admission System",
  description:
    "First-come, first-served online school admission system. Apply for classes, hold seats, and confirm admissions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background antialiased`}>
        <QueryProvider>
          <Header />
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
