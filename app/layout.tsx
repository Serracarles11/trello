import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Mesa de Trading Ops - Kanban",
  description: "Mini gestor Kanban con auditoría y modo Dios"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-slate-50 font-body text-slate-900">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}

