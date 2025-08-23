'use client';
/*
  Purpose: Clerk Sign-Up page wrapper.
*/
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignUp routing="hash" />
    </div>
  );
}
