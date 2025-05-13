// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, KeyRound, RotateCcw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { sendPasswordReset } = useAuth(); // Use the context method
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await sendPasswordReset(email); // Use AuthContext method
    if (result.success) {
      toast({ title: 'Request Submitted', description: result.message });
      setSuccessMessage(result.message);
    } else {
      setError(result.message);
      toast({ title: 'Request Failed', description: result.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4 selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 overflow-hidden rounded-xl">
        <CardHeader className="space-y-2 text-center pt-10 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <KeyRound className="mx-auto h-14 w-14 text-primary mb-3" />
          <CardTitle className="text-4xl font-bold text-primary tracking-tight">Forgot Password?</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">Enter your email to receive reset instructions.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pt-8 pb-6">
          {successMessage ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-green-600">{successMessage}</p>
              <Button asChild variant="link" className="text-primary hover:underline">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="grid gap-2.5">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground"><Mail className="h-4 w-4 text-muted-foreground" />Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive text-center pt-1.5">{error}</p>
              )}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-5 w-5" /> Send Reset Link
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm pb-10 bg-primary/5 pt-6">
          <p className="text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline hover:text-accent">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
