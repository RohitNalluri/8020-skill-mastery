'use client';
/*
  Purpose: Global app header with nav links and user menu.
*/
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold">8020</Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/plans">Plans</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <UserButton afterSignOutUrl="/sign-in"/>
        </div>
      </div>
    </header>
  );
}
