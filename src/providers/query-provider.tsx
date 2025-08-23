'use client';
/*
  Purpose: React Query provider for app-wide caching & mutations.
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient();
  }
  return queryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
