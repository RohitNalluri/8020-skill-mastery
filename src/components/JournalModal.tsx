'use client';
/*
  Purpose: JournalModal captures post-session reflections.
  Fields (required):
  - challenge: Biggest challenge
  - breakthrough: One small breakthrough
  Validation: Zod via RHF resolver.
  Notes: Uses a simple accessible overlay; no shadcn Dialog dependency required.
*/
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const schema = z.object({
  challenge: z.string().min(1, 'Required'),
  breakthrough: z.string().min(1, 'Required'),
});

export type JournalModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof schema>) => Promise<void> | void;
  defaultValues?: Partial<z.infer<typeof schema>>;
};

export function JournalModal({ open, onClose, onSubmit, defaultValues }: JournalModalProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { challenge: '', breakthrough: '', ...defaultValues },
  });

  const submitting = form.formState.isSubmitting;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post-session Journal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Post-session Journal</h2>
          <Button variant="outline" onClick={onClose} aria-label="Close Journal">
            Close
          </Button>
        </div>

        <form
          className="p-4 space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            onClose();
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="challenge">Biggest challenge</Label>
            <textarea
              id="challenge"
              rows={3}
              className="w-full rounded-md border p-2 text-sm bg-background"
              {...form.register('challenge')}
            />
            {form.formState.errors.challenge && (
              <p className="text-xs text-red-500">{form.formState.errors.challenge.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakthrough">One small breakthrough</Label>
            <textarea
              id="breakthrough"
              rows={3}
              className="w-full rounded-md border p-2 text-sm bg-background"
              {...form.register('breakthrough')}
            />
            {form.formState.errors.breakthrough && (
              <p className="text-xs text-red-500">{form.formState.errors.breakthrough.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" aria-busy={submitting} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
