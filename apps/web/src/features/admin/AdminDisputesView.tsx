'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const DATE = new Intl.DateTimeFormat('he-IL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function AdminDisputesView() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  const { data: appointments, isLoading } = trpc.admin.getUserAppointments.useQuery(
    { phone: searchPhone },
    { enabled: searchPhone.length > 0 },
  );

  return (
    <div className="p-8" dir="ltr">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Look up appointment history by phone number</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearchPhone(phone); }}
        className="flex gap-2 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972 5X-XXXXXXX"
            className="pl-9"
            dir="ltr"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <div className="text-gray-400 text-sm">Loading appointments...</div>}

      {appointments && appointments.length === 0 && (
        <div className="text-gray-400 text-sm">No appointments found for this number.</div>
      )}

      {appointments && appointments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found for{' '}
              <span className="font-mono">{searchPhone}</span>
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 font-medium">Salon</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{a.salon.name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.service.name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.staff.display_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{DATE.format(new Date(a.start_datetime))}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        a.status === 'CANCELLED'
                          ? 'destructive'
                          : a.status === 'COMPLETED'
                          ? 'outline'
                          : 'default'
                      }
                    >
                      {a.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
