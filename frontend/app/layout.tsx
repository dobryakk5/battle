import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Платформа судейства баттлов",
  description: "Система судейства танцевальных соревнований",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-slate-950 text-white min-h-screen">
        <div className="min-h-full">
          <main className="px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
