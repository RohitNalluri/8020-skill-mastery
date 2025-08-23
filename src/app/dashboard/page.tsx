'use client';
/*
  Purpose: Simple dashboard landing page for quick navigation and overview.
*/
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/plans">View Plans</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Skill Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Create or continue your 30-day mastery plans.</p>
            <Button size="sm" asChild>
              <Link href="/plans">Go to Plans</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Manage your Gemini API key (BYOK) and preferences.</p>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Track streaks, leaderboard, and insights.</p>
            <Button size="sm" variant="outline" disabled>
              Explore
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
