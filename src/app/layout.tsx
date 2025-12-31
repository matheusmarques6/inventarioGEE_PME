import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "GEE Inventory - Inventário de Gases de Efeito Estufa",
  description:
    "Plataforma SaaS para inventário de emissões de GEE para PMEs brasileiras",
  keywords: ["GEE", "carbono", "emissões", "inventário", "sustentabilidade"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
