'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const DATE = new Intl.DateTimeFormat('he-IL');

export default function AdminUsersView() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading } = trpc.admin.getUsers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 },
  );

  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const { data: appointments } = trpc.admin.getUserAppointments.useQuery(
    { phone: selectedPhone ?? '' },
    { enabled: !!selectedPhone },
  );

  return (
    <div className="p-8" dir="ltr">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-0.5">Search by phone, email, or name</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearchQuery(query); setSelectedPhone(null); }}
        className="flex gap-2 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone, email, or name..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <div className="text-gray-400 text-sm">Searching...</div>}

      {users && users.length === 0 && (
        <div className="text-gray-400 text-sm">No users found.</div>
      )}

      <div className="space-y-4">
        {users?.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{user.global_role}</Badge>
                  {!user.is_active && <Badge variant="destructive">Disabled</Badge>}
                </div>
              </div>
              <p className="text-xs text-gray-400 shrink-0">{DATE.format(new Date(user.created_at))}</p>
            </div>

            {user.owned_salons.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Owned salons</p>
                <div className="flex flex-wrap gap-2">
                  {user.owned_salons.map((s) => (
                    <span key={s.id} className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-700">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.phone && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-xs h-7"
                onClick={() =>
                  setSelectedPhone(selectedPhone === user.phone ? null : user.phone ?? null)
                }
              >
                {selectedPhone === user.phone ? 'Hide appointments' : 'View appointments'}
              </Button>
            )}

            {selectedPhone === user.phone && appointments && (
              <div className="mt-4 overflow-x-auto">
                {appointments.length === 0 ? (
                  <p className="text-sm text-gray-400">No appointments found.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-2 pr-3">Salon</th>
                        <th className="py-2 pr-3">Service</th>
                        <th className="py-2 pr-3">Staff</th>
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {appointments.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2 pr-3 text-gray-700">{a.salon.name}</td>
                          <td className="py-2 pr-3 text-gray-600">{a.service.name}</td>
                          <td className="py-2 pr-3 text-gray-600">{a.staff.display_name}</td>
                          <td className="py-2 pr-3 text-gray-500">{DATE.format(new Date(a.start_datetime))}</td>
                          <td className="py-2">
                            <Badge variant={a.status === 'CANCELLED' ? 'destructive' : 'outline'} className="text-xs">
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
