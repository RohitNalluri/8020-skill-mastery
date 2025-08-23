'use client';
/*
  Purpose: Settings page to manage BYOK Gemini key and sign out.
*/
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignOutButton } from '@clerk/nextjs';

const schema = z.object({ apiKey: z.string().min(10, 'Enter a valid API key') });

export default function SettingsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = React.useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['settings', 'gemini'],
    queryFn: async () => {
      const res = await fetch('/api/settings/gemini-key');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ hasKey: boolean }>;
    },
  });

  const form = useForm<{ apiKey: string }>({
    resolver: zodResolver(schema),
    defaultValues: { apiKey: '' },
  });

  const save = useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await fetch('/api/settings/gemini-key', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    },
    onSuccess: async () => {
      setMsg('Saved');
      await qc.invalidateQueries({ queryKey: ['settings', 'gemini'] });
      form.reset();
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/gemini-key', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    },
    onSuccess: async () => {
      setMsg('Removed');
      await qc.invalidateQueries({ queryKey: ['settings', 'gemini'] });
    },
  });

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <SignOutButton><Button variant="secondary">Sign out</Button></SignOutButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key (BYOK)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{data?.hasKey ? 'A key is stored for your account.' : 'No key stored.'}</p>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" type="password" placeholder="paste here" {...form.register('apiKey')} />
          </div>
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </CardContent>
        <CardFooter className="flex items-center gap-2">
          <Button onClick={form.handleSubmit((v) => save.mutate(v.apiKey))} disabled={save.isPending}>Save</Button>
          <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>Remove</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
