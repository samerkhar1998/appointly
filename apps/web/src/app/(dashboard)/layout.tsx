import { DashboardSidebar } from '@/features/dashboard/DashboardSidebar';
import { MobileNav } from '@/features/dashboard/MobileNav';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <DashboardSidebar />

      {/* Mobile navigation — top header + bottom tabs + hamburger drawer */}
      <MobileNav />

      {/* Main content area */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">{children}</div>
      </main>

      <Toaster />
    </div>
  );
}
