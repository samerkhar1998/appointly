'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  // Current image URL (controlled)
  value?: string;
  // Called with the new Cloudinary URL after a successful upload
  onChange: (url: string) => void;
  // Cloudinary sub-folder — must be one of: salons | staff | products
  folder: 'salons' | 'staff' | 'products';
  // Visual aspect ratio of the drop zone
  aspect?: 'square' | 'wide';
  // Accessible label for the input
  label?: string;
  className?: string;
  // Disables interaction during parent form submission
  disabled?: boolean;
}

// ImageUpload — click-to-upload component backed by POST /api/upload.
// Renders a preview when a URL is present; otherwise shows a placeholder.
// Handles validation, upload progress, and error display locally.
export function ImageUpload({
  value,
  onChange,
  folder,
  aspect = 'square',
  label = 'העלה תמונה',
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Triggers the hidden file input.
  function handleClick() {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }

  // Handles file selection — validates then uploads via the API route.
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation (mirrors server-side)
    if (!file.type.startsWith('image/')) {
      setError('קובץ חייב להיות תמונה');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('הקובץ גדול מדי — מקסימום 10 MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body });
      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Upload failed');
      }

      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאת העלאה');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  // Clears the current image (calls onChange with empty string).
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  const isWide = aspect === 'wide';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        aria-label={label}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={cn(
          'relative group overflow-hidden rounded-xl border-2 border-dashed transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
          value
            ? 'border-transparent'
            : 'border-border hover:border-brand-400',
          isWide ? 'w-full h-36' : 'w-24 h-24',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !uploading && 'cursor-pointer',
        )}
      >
        {/* ── Current image preview ─────────────────────────────────────── */}
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-foreground shadow">
                <Upload className="w-4 h-4" />
              </div>
            </div>
            {/* Clear button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="הסר תמונה"
                className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          /* ── Placeholder ──────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-muted">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </>
            )}
          </div>
        )}

        {/* ── Upload progress overlay ───────────────────────────────────── */}
        {uploading && value && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        aria-label={label}
      />
    </div>
  );
}
