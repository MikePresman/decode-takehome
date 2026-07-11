import type { Metadata } from "next";

import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beauty Med Spa Analytics",
  description: "Patients, analytics, and AI-ready intelligence for Beauty Med Spa"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f4ebdf] text-foreground antialiased">
        <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b border-white/6 bg-[#1c1917] lg:min-h-screen lg:border-b-0 lg:border-r lg:border-r-white/6">
            <div className="flex h-full flex-col px-4 py-5 sm:px-5 lg:px-4">
              <div className="mb-8 flex items-center gap-3 px-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c98c42] text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M8 8.5a3.5 3.5 0 0 1 7 0c0 1.2-.6 2.2-1.2 3" />
                    <path d="M9.5 16.5c.8.9 1.6 1.3 2.5 1.3 2.5 0 4.5-2.6 4.5-5.9" />
                    <path d="M7 8.5c0 3.5 2 6 5 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#f1e5d8]">
                    Beauty Med Spa
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#73685e]">
                    Analytics
                  </p>
                </div>
              </div>

              <SidebarNav />
            </div>
          </aside>

          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
