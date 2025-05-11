// src/app/login/page.tsx
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
import { Loader2, LogIn, KeyRound, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useAuth(); 
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password); 

      if (result.success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back! Redirecting...',
        });
        // Redirection is handled by AuthContext
      } else {
        setError(result.message || 'Login failed.');
        toast({
          title: 'Login Failed',
          description: result.message || 'Please check your email and password.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error("Login process failed:", err);
      setError('An unexpected error occurred during login.');
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Google Sign-In will be available in a future update.',
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4 selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 overflow-hidden rounded-xl">
        <CardHeader className="space-y-2 text-center pt-10 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <LogIn className="mx-auto h-14 w-14 text-primary mb-3" />
          <CardTitle className="text-4xl font-bold text-primary tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">Login to manage your volunteer activities.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pt-8 pb-6">
          <form onSubmit={handleEmailLogin} className="space-y-6">
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
            <div className="grid gap-2.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground"><KeyRound className="h-4 w-4 text-muted-foreground" />Password</Label>
                <Link href="/forgot-password" passHref>
                  <Button variant="link" size="sm" className="text-xs h-auto p-0 text-primary hover:underline hover:text-accent">Forgot password?</Button>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" /> Login
                </>
              )}
            </Button>
          </form>

          <Separator className="my-8" />
          <Button
            variant="outline"
            className="w-full py-3 text-base font-semibold border-border hover:bg-muted/50 hover:border-primary/50 rounded-md shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
            onClick={handleGoogleSignIn}
            disabled // Keep disabled as functionality is not fully implemented
          >
            <svg className="mr-2.5 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.5 512 0 401.5 0 265.5S110.5 19 244 19c70.5 0 132.5 29.5 177.5 78.5l-67.5 62.5C320.5 134.5 286 112 244 112c-83.5 0-151.5 67.5-151.5 153.5S160.5 419 244 419c52.5 0 96.5-20.5 126-50.5 27-27 43.5-62.5 48.5-107.5H244V261.8h244z"></path></svg>
            Sign in with Google
          </Button>

        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm pb-10 bg-primary/5 pt-6">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline hover:text-accent">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
