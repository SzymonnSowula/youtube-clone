import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="bg-[#0F0F0F] text-white overflow-hidden">
        <Navbar user={user} />
        <div className="flex pt-16 h-screen">
          <Sidebar user={user} />
          <main className="flex-1 overflow-y-auto w-full md:pl-60 pb-20 md:pb-0 relative">
            <div className="max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
