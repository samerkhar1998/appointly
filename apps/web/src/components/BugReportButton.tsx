'use client';

import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bug, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

const schema = z.object({
  type: z.enum(['BUG', 'SUGGESTION', 'OTHER']),
  title: z.string().min(1, 'נדרש כותרת').max(200),
  description: z.string().min(1, 'נדרש תיאור').max(5000),
});
type FormData = z.infer<typeof schema>;

export default function BugReportButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith('/admin')) return null;
  const [submitted, setSubmitted] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'BUG' },
  });

  const typeValue = watch('type');

  const submitMutation = trpc.admin.submitBugReport.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  async function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'bug-reports');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      setScreenshotUrl(data.url);
    } catch {
      alert('שגיאה בהעלאת התמונה. נסה שוב.');
    } finally {
      setUploading(false);
    }
  }

  function removeScreenshot() {
    setScreenshotUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onSubmit(data: FormData) {
    submitMutation.mutate({
      type: data.type,
      title: data.title,
      description: data.description,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      screenshot_url: screenshotUrl ?? undefined,
    });
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setScreenshotUrl(null);
      reset();
    }, 300);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 start-6 z-50 w-12 h-12 rounded-full bg-[#0f172a] text-white shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
        aria-label="דווח על בעיה"
        title="דווח על בעיה"
      >
        <Bug className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>דווח על בעיה</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900">תודה! הדיווח התקבל</p>
              <p className="text-sm text-gray-500">נבדוק את הדיווח ונחזור אם יש צורך.</p>
              <Button onClick={handleClose} className="w-full mt-2">סגור</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>סוג</Label>
                <Select value={typeValue} onValueChange={(v) => setValue('type', v as FormData['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUG">באג / תקלה</SelectItem>
                    <SelectItem value="SUGGESTION">הצעה לשיפור</SelectItem>
                    <SelectItem value="OTHER">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="br-title">כותרת</Label>
                <Input
                  id="br-title"
                  placeholder="תיאור קצר של הבעיה"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="br-desc">תיאור</Label>
                <Textarea
                  id="br-desc"
                  placeholder="תאר מה קרה..."
                  rows={4}
                  className="resize-none"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              {/* Screenshot upload */}
              <div className="space-y-1.5">
                <Label>צילום מסך (אופציונלי)</Label>
                {screenshotUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={screenshotUrl}
                      alt="screenshot"
                      width={400}
                      height={200}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs">{uploading ? 'מעלה...' : 'הוסף צילום מסך'}</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
              </div>

              {submitMutation.isError && (
                <p className="text-xs text-red-500">שגיאה בשליחת הדיווח. נסה שוב.</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={submitMutation.isPending || uploading} className="flex-1">
                  {submitMutation.isPending ? 'שולח...' : 'שלח דיווח'}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  ביטול
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
