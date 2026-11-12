import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "CareerBridge — From Potential to Placement",
  description: "Career Intelligence Workspace. An intelligent career guidance and campus placement platform connecting students, recruiters and university placement officers.",
  keywords: ["Career Intelligence", "Campus Placement", "ATS Resume", "AI Job Match", "Skill Gap Analysis", "University Placement"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-cream text-primary font-sans antialiased selection:bg-lime/30 selection:text-primary">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
