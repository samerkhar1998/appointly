import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { trpc } from '@/lib/trpc';
import { colors } from '@/lib/theme';

type BugReportType = 'BUG' | 'SUGGESTION' | 'OTHER';

const TYPE_LABELS: Record<BugReportType, string> = {
  BUG: 'באג / תקלה',
  SUGGESTION: 'הצעה לשיפור',
  OTHER: 'אחר',
};

interface Props {
  userId?: string;
  userPhone?: string;
  /** When provided, the FAB is hidden and the modal state is controlled externally */
  open?: boolean;
  onClose?: () => void;
}

export function BugReportButton({ userId, userPhone, open: controlledOpen, onClose }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  function setOpen(v: boolean) {
    if (controlledOpen !== undefined) {
      if (!v) onClose?.();
    } else {
      setInternalOpen(v);
    }
  }
  const [type, setType] = useState<BugReportType>('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.admin.submitBugReport.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setError(null);
      setTitle('');
      setDescription('');
      setType('BUG');
    }, 300);
  }

  function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      setError('יש למלא כותרת ותיאור');
      return;
    }
    setError(null);
    submitMutation.mutate({
      type,
      title: title.trim(),
      description: description.trim(),
      device_info: `${Platform.OS} ${Platform.Version as string}`,
      user_id: userId,
      phone: userPhone,
    });
  }

  return (
    <>
      {/* Floating trigger — only shown when not controlled externally */}
      {controlledOpen === undefined && (
        <Pressable
          onPress={() => setOpen(true)}
          style={styles.fab}
          accessibilityLabel="דווח על בעיה"
        >
          <Text style={styles.fabIcon}>🐛</Text>
        </Pressable>
      )}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {submitted ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>תודה! הדיווח התקבל</Text>
                <Text style={styles.successSub}>נבדוק את הדיווח ונחזור אם יש צורך.</Text>
                <Pressable style={styles.primaryBtn} onPress={handleClose}>
                  <Text style={styles.primaryBtnText}>סגור</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.title}>דווח על בעיה</Text>

                {/* Type picker */}
                <Text style={styles.label}>סוג</Text>
                <View style={styles.typeRow}>
                  {(Object.keys(TYPE_LABELS) as BugReportType[]).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      style={[styles.typePill, type === t && styles.typePillActive]}
                    >
                      <Text style={[styles.typePillText, type === t && styles.typePillTextActive]}>
                        {TYPE_LABELS[t]}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>כותרת</Text>
                <TextInput
                  style={styles.input}
                  placeholder="תיאור קצר של הבעיה"
                  value={title}
                  onChangeText={setTitle}
                  textAlign="right"
                />

                <Text style={styles.label}>תיאור</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="תאר מה קרה..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlign="right"
                  textAlignVertical="top"
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  style={[styles.primaryBtn, submitMutation.isPending && styles.primaryBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>שלח דיווח</Text>
                  )}
                </Pressable>

                <Pressable style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>ביטול</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  typePillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  typePillText: {
    fontSize: 12,
    color: '#6b7280',
  },
  typePillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    marginBottom: 14,
  },
  textarea: {
    height: 100,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'right',
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6b7280',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});
