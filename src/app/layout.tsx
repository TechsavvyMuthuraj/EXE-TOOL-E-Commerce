import type { Metadata } from "next";
import { Exo_2, Orbitron, Share_Tech_Mono } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import PageTransition from "@/components/layout/PageTransition";
import AntigravityBackground from "@/components/layout/AntigravityBackground";
import "./globals.css";

const exo = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const shareTech = Share_Tech_Mono({
  variable: "--font-sharetech",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "EXE TOOL — Premium Windows Software Marketplace",
  description: "EXE TOOL: Premium digital tools and software for Windows optimization, debloating, and performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${exo.variable} ${orbitron.variable} ${shareTech.variable}`}>
        <AntigravityBackground />
        <ClientShell>
          <PageTransition>
            {children}
          </PageTransition>
        </ClientShell>
      </body>
    </html>
  );
}
