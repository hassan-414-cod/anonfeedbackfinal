import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import Toaster from "@/components/Toaster";

export const metadata: Metadata = {
  title: "Anon-Feedback — honest feedback, zero names",
  description:
    "Upload your project, get brutally honest anonymous feedback, and join anonymous chat rooms. No clout. No names.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col items-center w-full">
            <div className="w-full max-w-7xl flex-grow flex flex-col">
              {children}
            </div>
          </main>
          <Footer />
          <AuthModal />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
