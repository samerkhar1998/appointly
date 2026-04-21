import { requireAdmin } from '@/lib/admin-auth';
import AdminSettingsView from '@/features/admin/AdminSettingsView';

export default async function AdminSettingsPage() {
  await requireAdmin();
  return <AdminSettingsView />;
}
