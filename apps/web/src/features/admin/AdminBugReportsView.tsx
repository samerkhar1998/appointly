'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/use-toast';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

const DATE = new Intl.DateTimeFormat('he-IL');

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  NEW: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
};

const TYPE_COLORS: Record<string, 'destructive' | 'default' | 'secondary'> = {
  BUG: 'destructive',
  SUGGESTION: 'default',
  OTHER: 'secondary',
};

export default function AdminBugReportsView() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState('');

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getBugReports.useQuery({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? (statusFilter as 'NEW' | 'IN_PROGRESS' | 'RESOLVED') : undefined,
    type: typeFilter !== 'all' ? (typeFilter as 'BUG' | 'SUGGESTION' | 'OTHER') : undefined,
  });

  const { data: report } = trpc.admin.getBugReport.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  const updateStatus = trpc.admin.updateBugReportStatus.useMutation({
    onSuccess: () => {
      void utils.admin.getBugReports.invalidate();
      void utils.admin.getBugReport.invalidate({ id: selectedId! });
    },
  });

  const addNote = trpc.admin.addBugReportNote.useMutation({
    onSuccess: () => {
      setNoteBody('');
      void utils.admin.getBugReport.invalidate({ id: selectedId! });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="p-8" dir="ltr">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bug Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">User-submitted reports and suggestions</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="BUG">Bug</SelectItem>
              <SelectItem value="SUGGESTION">Suggestion</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Submitted by</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Page</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && data?.rows.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedId(r.id)}
              >
                <td className="px-4 py-3">
                  <Badge variant={TYPE_COLORS[r.type]}>{r.type}</Badge>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{r.title}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {r.submitted_by_user?.name ?? r.submitted_by_name ?? (
                    <span className="text-gray-400">Anonymous</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">
                  {r.page_url ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{DATE.format(new Date(r.created_at))}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_COLORS[r.status]}>{r.status.replace('_', ' ')}</Badge>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No reports found</td>
              </tr>
            )}
          </tbody>
        </table>

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

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open: boolean) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-xl overflow-y-auto max-h-[90vh]" dir="ltr">
          {report && (
            <>
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={TYPE_COLORS[report.type]}>{report.type}</Badge>
                  <Badge variant={STATUS_COLORS[report.status]}>{report.status.replace('_', ' ')}</Badge>
                </div>
                <DialogTitle className="text-lg leading-tight">{report.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {report.description}
                </div>

                {/* Meta */}
                <div className="text-xs text-gray-500 space-y-1">
                  {(report.submitted_by_user?.name ?? report.submitted_by_name) && (
                    <p>
                      Submitted by:{' '}
                      <span className="text-gray-700">
                        {report.submitted_by_user?.name ?? report.submitted_by_name}
                      </span>
                    </p>
                  )}
                  {report.submitted_by_phone && (
                    <p>Phone: <span className="text-gray-700">{report.submitted_by_phone}</span></p>
                  )}
                  {report.page_url && (
                    <p>Page: <span className="text-gray-700 break-all">{report.page_url}</span></p>
                  )}
                  {report.device_info && (
                    <p>Device: <span className="text-gray-700 break-all">{report.device_info}</span></p>
                  )}
                  <p>Reported: <span className="text-gray-700">{DATE.format(new Date(report.created_at))}</span></p>
                  {report.screenshot_url && (
                    <div className="mt-3">
                      <p className="text-gray-500 mb-1.5">Screenshot:</p>
                      <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={report.screenshot_url}
                          alt="screenshot"
                          className="rounded-lg border border-gray-200 max-h-60 w-full object-contain bg-gray-50 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  )}
                </div>

                {/* Status change */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Select
                    value={report.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({ id: report.id, status: v as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' })
                    }
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes ({report.notes.length})</p>
                  {report.notes.length === 0 && (
                    <p className="text-xs text-gray-400">No notes yet.</p>
                  )}
                  <div className="space-y-3">
                    {report.notes.map((note) => (
                      <div key={note.id} className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
                        <p className="text-gray-800">{note.body}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.admin.name} · {DATE.format(new Date(note.created_at))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add note */}
                <div className="space-y-2">
                  <Textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Add an internal note..."
                    className="resize-none text-sm"
                    rows={3}
                  />
                  <Button
                    size="sm"
                    disabled={!noteBody.trim() || addNote.isPending}
                    onClick={() =>
                      addNote.mutate({ report_id: report.id, body: noteBody.trim() })
                    }
                    className="gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Add Note
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
