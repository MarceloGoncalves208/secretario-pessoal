import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-0">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
