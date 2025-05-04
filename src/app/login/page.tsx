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

        // Redirect based on role returned by mock signIn (updated roles)
        if (result.role === 'organization') {
          router.push('/dashboard/organization');
        } else if (result.role === 'volunteer') {
          router.push('/dashboard/volunteer');
        } else {
          // If role is not set or null, redirect to role selection or default dashboard
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary via-background to-secondary p-4"> {/* Added gradient background */}
      <Card className="w-full max-w-md shadow-xl border"> {/* Increased shadow */}
        <CardHeader className="space-y-2 text-center pt-8 pb-4"> {/* Adjusted padding */}
          <LogIn className="mx-auto h-10 w-10 text-primary mb-2" /> {/* Added icon */}
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
          <CardDescription>Login to manage your volunteer activities.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6"> {/* Adjusted padding */}
          <form onSubmit={handleLogin} className="space-y-5"> {/* Increased spacing */}
            <div className="grid gap-1.5"> {/* Adjusted gap */}
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-primary/50" // Added focus styles
              />
            </div>
            <div className="grid gap-1.5"> {/* Adjusted gap */}
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-primary/50" // Added focus styles
              />
            </div>
             {error && (
               <p className="text-sm text-destructive text-center pt-1">{error}</p> // Added top padding
             )}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base font-semibold" disabled={loading}> {/* Increased padding/font size */}
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
        <CardFooter className="flex flex-col gap-3 text-center text-sm pb-8"> {/* Increased gap and padding */}
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
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
