'use client';
/*
  Purpose: OneThingCard renders the single most important task ("One Thing")
  for today. It shows the task title/description, and provides Begin Session
  (stub for now) and Mark Done actions. Designed to keep the daily entry flow
  frictionless and aligned with the 80/20 principle.
*/
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type OneThing = {
  weekTitle: string;
  day: number;
  key: string;
  task: { title: string; description: string; resource?: string };
};

export type OneThingCardProps = {
  oneThing: OneThing | null;
  isChecking?: boolean;
  onBegin?: (ot: OneThing) => void;
  onDone?: (ot: OneThing) => void;
};

export function OneThingCard({ oneThing, isChecking, onBegin, onDone }: OneThingCardProps) {
  if (!oneThing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your One Thing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No pending tasks. Create your first Skill Path to get started.
          </p>
          <Button asChild>
            <Link href="/plans">Create a Skill Path</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isProduce = (oneThing.task.resource ?? '') === '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Your One Thing</CardTitle>
          <div className="mt-1 text-xs text-muted-foreground">
            {oneThing.weekTitle} · Day {oneThing.day}
          </div>
        </div>
        {isProduce ? (
          <Badge variant="secondary">Produce</Badge>
        ) : (
          <Badge variant="outline">Learn</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="font-medium">{oneThing.task.title}</div>
          {oneThing.task.description ? (
            <p className="text-sm text-muted-foreground mt-1">{oneThing.task.description}</p>
          ) : null}
          {!isProduce && (oneThing.task.resource ?? '').trim() ? (
            <div className="mt-2">
              <a
                href={oneThing.task.resource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline text-primary hover:text-primary/80"
              >
                Open Resource
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => oneThing && onBegin?.(oneThing)}
            aria-label="Begin Session"
          >
            Begin Session
          </Button>
          <Button
            variant="secondary"
            disabled={isChecking}
            aria-busy={isChecking}
            onClick={() => oneThing && onDone?.(oneThing)}
            aria-label="Mark Done"
          >
            {isChecking ? 'Saving…' : 'Mark Done'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
