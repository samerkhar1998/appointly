'use client';

import { trpc } from '@/lib/trpc';
import { Store, Users, TrendingUp, Bug, Activity } from 'lucide-react';

const ILS = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error } = trpc.admin.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load stats: {error.message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8" dir="ltr">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Salons" value={data.total_salons} icon={Store} color="bg-blue-500" />
        <StatCard label="Active Salons" value={data.active_salons} icon={Activity} color="bg-green-500" />
        <StatCard label="Total Users" value={data.total_owners + data.total_customers} icon={Users} color="bg-purple-500" />
        <StatCard label="MRR" value={ILS.format(data.mrr)} icon={TrendingUp} color="bg-amber-500" />
        <StatCard label="Open Bug Reports" value={data.open_bug_reports} icon={Bug} color="bg-red-500" />
      </div>
    </div>
  );
}
