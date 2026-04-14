'use client';

import { useState } from 'react';
import { Search, Users, Phone, Mail, CalendarCheck, Ban, ShieldCheck, ChevronRight, ChevronLeft, StickyNote, X, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSalon } from '@/lib/use-salon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/lib/use-toast';

const PER_PAGE = 20;

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(date),
  );
}

export function ClientsPage() {
  const { salon, isLoading: salonLoading } = useSalon();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [noteDialog, setNoteDialog] = useState<{ id: string; name: string; notes: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<{ id: string; name: string } | null>(null);
  const utils = trpc.useUtils();

  // Debounce search
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }

  const { data, isLoading } = trpc.salonClients.list.useQuery(
    {
      salon_id: salon?.id ?? '',
      search: debouncedSearch || undefined,
      page,
      per_page: PER_PAGE,
    },
    { enabled: !!salon?.id },
  );

  const blockMutation = trpc.salonClients.block.useMutation({
    onSuccess: () => {
      utils.salonClients.list.invalidate();
      toast({ title: 'לקוח חסום' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const unblockMutation = trpc.salonClients.unblock.useMutation({
    onSuccess: () => {
      utils.salonClients.list.invalidate();
      toast({ title: 'חסימה הוסרה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const removeMutation = trpc.salonClients.remove.useMutation({
    onSuccess: () => {
      utils.salonClients.list.invalidate();
      setRemoveConfirm(null);
      toast({ title: 'הלקוח הוסר מהרשימה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  const addNoteMutation = trpc.salonClients.addNote.useMutation({
    onSuccess: () => {
      utils.salonClients.list.invalidate();
      setNoteDialog(null);
      toast({ title: 'הערה נשמרה' });
    },
    onError: (err) => toast({ title: 'שגיאה', description: err.message, variant: 'destructive' }),
  });

  function openNoteDialog(client: { id: string; name: string; notes: string | null }) {
    setNoteDialog({ id: client.id, name: client.name, notes: client.notes ?? '' });
    setNoteText(client.notes ?? '');
  }

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1;

  if (salonLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">לקוחות</h1>
            {data && (
              <p className="text-sm text-muted mt-0.5">{data.total} לקוחות סה״כ</p>
            )}
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              placeholder="חיפוש לפי שם, טלפון או אימייל..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="ps-9"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !data?.items.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-border/50 shadow-card">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface mb-3">
              <Users className="h-5 w-5 text-muted" />
            </div>
            <p className="font-medium text-foreground">
              {debouncedSearch ? 'לא נמצאו תוצאות' : 'אין לקוחות עדיין'}
            </p>
            <p className="text-sm text-muted mt-1">
              {debouncedSearch ? 'נסה חיפוש אחר' : 'לקוחות יופיעו כאן לאחר ביצוע הזמנה ראשונה'}
            </p>
          </div>
        )}

        {!isLoading && !!data?.items.length && (
          <>
            {/* ── Mobile card list ── */}
            <div className="lg:hidden space-y-3">
              {data.items.map((client) => (
                <div
                  key={client.id}
                  className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{client.name}</p>
                      {client.notes && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">{client.notes}</p>
                      )}
                    </div>
                    <Badge variant={client.is_blocked ? 'destructive' : 'success'} className="shrink-0">
                      {client.is_blocked ? 'חסום' : 'פעיל'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted" dir="ltr">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {client.phone}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted" dir="ltr">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {client.email}
                      </div>
                    )}
                    {client.last_visit_at && (
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(client.last_visit_at)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 pt-1 border-t border-border/50">
                    <button
                      onClick={() => openNoteDialog(client)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition-colors min-h-[44px]"
                    >
                      <StickyNote className="h-4 w-4" />
                      הערה
                    </button>
                    {client.is_blocked ? (
                      <button
                        onClick={() => unblockMutation.mutate({ client_id: client.id })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors min-h-[44px]"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        בטל חסימה
                      </button>
                    ) : (
                      <button
                        onClick={() => blockMutation.mutate({ client_id: client.id })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
                      >
                        <Ban className="h-4 w-4" />
                        חסום
                      </button>
                    )}
                    <button
                      onClick={() => setRemoveConfirm({ id: client.id, name: client.name })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
                    >
                      <Trash2 className="h-4 w-4" />
                      הסר
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden lg:block rounded-2xl border border-border/50 bg-white shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>ביקור אחרון</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{client.name}</p>
                        {client.notes && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{client.notes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm text-foreground" dir="ltr">
                          <Phone className="h-3.5 w-3.5 text-muted shrink-0" />
                          {client.phone}
                        </span>
                      </TableCell>
                      <TableCell>
                        {client.email ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted" dir="ltr">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            {client.email}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.last_visit_at ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            {formatDate(client.last_visit_at)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">טרם ביקר</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.is_blocked ? 'destructive' : 'success'}>
                          {client.is_blocked ? 'חסום' : 'פעיל'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openNoteDialog(client)}
                            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                            title="הוסף הערה"
                          >
                            <StickyNote className="h-4 w-4" />
                          </button>
                          {client.is_blocked ? (
                            <button
                              onClick={() => unblockMutation.mutate({ client_id: client.id })}
                              className="p-2 rounded-lg text-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="הסר חסימה"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => blockMutation.mutate({ client_id: client.id })}
                              className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="חסום לקוח"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setRemoveConfirm({ id: client.id, name: client.name })}
                            className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="הסר לקוח"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              עמוד {page} מתוך {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-1"
              >
                <ChevronRight className="h-4 w-4" />
                הקודם
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="gap-1"
              >
                הבא
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הסרת לקוח</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted leading-relaxed">
            האם להסיר את <span className="font-semibold text-foreground">{removeConfirm?.name}</span>{' '}
            מרשימת הלקוחות? העסק לא יופיע יותר ברשימת העסקים שלהם.
          </p>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() =>
                removeConfirm && removeMutation.mutate({ client_id: removeConfirm.id })
              }
              disabled={removeMutation.isPending}
              className="w-full sm:w-auto"
            >
              {removeMutation.isPending ? 'מסיר...' : 'הסר לקוח'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRemoveConfirm(null)}
              className="w-full sm:w-auto"
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הערה על {noteDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="note">הערה פנימית</Label>
            <textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="הוסף הערה על הלקוח..."
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-muted text-end">{noteText.length}/2000</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                noteDialog && addNoteMutation.mutate({ client_id: noteDialog.id, notes: noteText })
              }
              disabled={addNoteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {addNoteMutation.isPending ? 'שומר...' : 'שמור הערה'}
            </Button>
            <Button variant="outline" onClick={() => setNoteDialog(null)} className="w-full sm:w-auto">
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
