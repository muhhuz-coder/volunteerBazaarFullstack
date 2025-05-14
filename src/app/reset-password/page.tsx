'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Get token from URL
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Missing reset token. Please check your reset link and try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      // Call the reset password API endpoint
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetComplete(true);
        toast({
          title: 'Password Reset Complete',
          description: 'Your password has been successfully reset.',
        });
      } else {
        setError(data.message || 'Password reset failed. Please try again or request a new reset link.');
        toast({
          title: 'Password Reset Failed',
          description: data.message || 'Please try again or request a new reset link.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: 'Reset Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <Button
        asChild
        variant="ghost"
        className="absolute top-4 left-4 flex items-center gap-2 hover:bg-background/60 hover:shadow-sm transition-all duration-200 group"
      >
        <Link href="/login">
          <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          <span>Back to Login</span>
        </Link>
      </Button>
      
      <Card className="w-full max-w-md shadow-2xl border-primary/20 overflow-hidden rounded-xl">
        <CardHeader className="space-y-2 text-center pt-10 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <Lock className="mx-auto h-14 w-14 text-primary mb-3" />
          <CardTitle className="text-4xl font-bold text-primary tracking-tight">Reset Password</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            {resetComplete 
              ? 'Your password has been reset'
              : 'Create a new secure password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pt-8 pb-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/30 mb-6">
              {error}
            </div>
          )}
          
          {!resetComplete ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2.5">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" />New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters long
                </p>
              </div>
              
              <div className="grid gap-2.5">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" />Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out" 
                disabled={loading || !token}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="bg-success/10 text-success p-4 rounded-md border border-success/30">
                <h3 className="font-semibold text-lg mb-2">Password Reset Successful!</h3>
                <p>Your password has been updated.</p>
                <p className="text-sm mt-2">You can now log in with your new password.</p>
              </div>
              <Button 
                variant="default" 
                className="mt-4"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm pb-10 bg-primary/5 pt-6">
          <p className="text-muted-foreground">
            Need a new reset link?{' '}
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline hover:text-accent">
              Request again
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 