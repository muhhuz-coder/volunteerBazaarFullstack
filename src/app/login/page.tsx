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
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useAuth(); // Use signIn from the mock context
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use the mock signIn function
      const result = await signIn(email, password);

      if (result.success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });

        // Redirect based on role returned by mock signIn
        if (result.role === 'company') {
          router.push('/dashboard/company');
        } else if (result.role === 'employee') {
          router.push('/dashboard/employee');
        } else {
          // If role is not set or null, redirect to role selection or default dashboard
          // This might happen if a mock user was created without a role somehow
          router.push('/select-role'); // Or '/' or a default dashboard
        }
      } else {
         setError(result.message || 'Login failed.');
         toast({
           title: 'Login Failed',
           description: result.message || 'Please check your email and password.',
           variant: 'destructive',
         });
      }

    } catch (err: any) {
      // Catch unexpected errors during the mock process
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Login</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>
             {error && (
               <p className="text-sm text-destructive text-center">{error}</p>
             )}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                 <>
                  <LogIn className="mr-2 h-4 w-4" /> Login
                 </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="underline text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>
           {/* Add Forgot Password link later if needed */}
           {/* <Link href="/forgot-password" className="underline text-muted-foreground hover:text-primary/80">
             Forgot password?
           </Link> */}
        </CardFooter>
      </Card>
    </div>
  );
}
