'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Copy, Check, UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSettingsView() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => setInviteUrl(data.url),
  });

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8" dir="ltr">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Platform configuration</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Invite Super Admin */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">Invite Super Admin</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Generate a one-time registration link. The link expires after use.
              </p>

              <div className="mt-4 space-y-3">
                <Button
                  onClick={() => createInvite.mutate()}
                  disabled={createInvite.isPending}
                  className="gap-2"
                >
                  {createInvite.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {inviteUrl ? 'Generate New Link' : 'Generate Invite Link'}
                </Button>

                {inviteUrl && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invite URL</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <code className="flex-1 text-xs text-gray-700 break-all font-mono leading-relaxed">
                        {inviteUrl}
                      </code>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors text-gray-500"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      ⚠ Single-use — share this link privately. It becomes invalid after registration.
                    </p>
                  </div>
                )}

                {createInvite.isError && (
                  <p className="text-xs text-red-500">Failed to generate invite. Try again.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
