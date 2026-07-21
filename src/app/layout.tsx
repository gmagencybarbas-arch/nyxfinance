import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TapSoundProvider } from "@/components/TapSoundProvider";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ThemeScript } from "@/components/ThemeScript";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Mini-Nyx | Controle financeiro com assistente de voz",
  description: "App de controle financeiro com assistente de voz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          <ProfileProvider>
            <ThemeProvider>
              <ToastProvider>
                <AssistantProvider>
                  <TapSoundProvider>
                    <div className="pb-[max(5rem,calc(4.5rem+env(safe-area-inset-bottom)))] md:pb-0">
                      {children}
                    </div>
                    <BottomNav />
                  </TapSoundProvider>
                </AssistantProvider>
              </ToastProvider>
            </ThemeProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
