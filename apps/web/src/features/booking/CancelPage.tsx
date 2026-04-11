'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/lib/use-toast';
import { AlertTriangle, CheckCircle2, Loader2, Scissors, XCircle } from 'lucide-react';

interface Props {
  token: string;
}

type State = 'idle' | 'confirming' | 'success' | 'error';

export function CancelPage({ token }: Props) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const cancelMutation = trpc.appointments.cancelByToken.useMutation({
    onSuccess: () => setState('success'),
    onError: (err) => {
      setErrorMsg(err.message);
      setState('error');
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    },
  });

  function handleConfirm() {
    setState('confirming');
    cancelMutation.mutate({ token });
  }

  return (
    <>
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 65%)`,
        }}
      >
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 shadow-card mb-3">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-muted">Appointly</p>
          </div>

          <div className="bg-white rounded-2xl shadow-elevated border border-border/50 p-8 text-center">
            {state === 'idle' && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tighter text-foreground">ביטול תור</h1>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    האם אתה בטוח שברצונך לבטל את התור? פעולה זו אינה הפיכה.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700"
                    onClick={handleConfirm}
                  >
                    כן, בטל את התור
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.history.back()}
                  >
                    לא, חזור
                  </Button>
                </div>
              </div>
            )}

            {state === 'confirming' && (
              <div className="space-y-4 py-4 animate-in fade-in duration-250">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
                <p className="text-muted text-sm">מבטל את התור...</p>
              </div>
            )}

            {state === 'success' && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter text-foreground">
                    התור בוטל בהצלחה
                  </h2>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    נשמח לראות אותך שוב. ניתן לקבוע תור חדש בכל עת.
                  </p>
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="space-y-6 animate-in fade-in duration-250">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border-2 border-red-200">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter text-foreground">לא ניתן לבטל</h2>
                  <p className="text-sm text-muted mt-2 leading-relaxed">{errorMsg}</p>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setState('idle')}
                >
                  נסה שוב
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
