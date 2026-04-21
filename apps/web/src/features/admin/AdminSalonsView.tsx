'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/use-toast';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const DATE = new Intl.DateTimeFormat('he-IL');

export default function AdminSalonsView() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getSalons.useQuery({ page, limit: 20, search: search || undefined });
  const { data: plans } = trpc.admin.getPlans.useQuery();

  const setActiveMutation = trpc.admin.setSalonActive.useMutation({
    onSuccess: () => { void utils.admin.getSalons.invalidate(); toast({ title: 'Updated' }); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const setPlanMutation = trpc.admin.setSalonPlan.useMutation({
    onSuccess: () => { void utils.admin.getSalons.invalidate(); toast({ title: 'Plan updated' }); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="p-8" dir="ltr">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salons</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all salons on the platform</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search salons, owners..."
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Salon</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Owner</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">City</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Created</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && data?.rows.map((salon) => (
              <tr key={salon.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {salon.name}
                  <span className="block text-xs text-gray-400 font-normal">{salon.slug}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {salon.owner ? (
                    <>
                      {salon.owner.name}
                      <span className="block text-xs text-gray-400">{salon.owner.email}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{salon.city ?? '—'}</td>
                <td className="px-4 py-3">
                  <Select
                    value={salon.plan.id}
                    onValueChange={(planId) =>
                      setPlanMutation.mutate({ salon_id: salon.id, plan_id: planId })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue>{salon.plan.display_name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={salon.is_active ? 'default' : 'destructive'}>
                    {salon.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {DATE.format(new Date(salon.created_at))}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={salon.is_active ? 'destructive' : 'outline'}
                    className="text-xs h-7"
                    onClick={() =>
                      setActiveMutation.mutate({ salon_id: salon.id, is_active: !salon.is_active })
                    }
                  >
                    {salon.is_active ? 'Suspend' : 'Reactivate'}
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No salons found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
