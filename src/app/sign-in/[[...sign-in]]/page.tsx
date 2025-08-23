'use client';
/*
  Purpose: Clerk Sign-In page wrapper.
*/
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignIn routing="hash" />
    </div>
  );
}
