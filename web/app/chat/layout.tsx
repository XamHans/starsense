import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chat AppStarSense",
  description: "Chat with your Github Repositories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black">
          <header className="bg-inherit text-primary-foreground py-4">
            <div className="container mx-auto px-4">
              <h1 className="text-2xl font-bold">StarSense </h1>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
