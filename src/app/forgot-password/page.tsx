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
import { Loader2, Mail, Home } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call our forgot password API
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast({
          title: 'Reset Email Sent',
          description: 'Check your email for password reset instructions.',
        });
        
        // For development, log the reset link
        if (data.devInfo?.resetLink) {
          console.log('Development reset link:', data.devInfo.resetLink);
        }
      } else {
        toast({
          title: 'Password Reset Failed',
          description: data.message || 'Please check your email address and try again.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error("Password reset process failed:", err);
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
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="mx-auto h-14 w-14 text-primary mb-3" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 10V6" />
            <circle cx="12" cy="14" r="2" />
            <path d="M3 10h1a2 2 0 1 1 0 4H3" />
            <path d="M21 10h-1a2 2 0 1 0 0 4h1" />
            <path d="M12 19v1" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <CardTitle className="text-4xl font-bold text-primary tracking-tight">Reset Password</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">Enter your email to receive reset instructions</CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pt-8 pb-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2.5">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />Email Address
                </Label>
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
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="bg-success/10 text-success p-4 rounded-md border border-success/30">
                <h3 className="font-semibold text-lg mb-2">Reset Email Sent!</h3>
                <p>We've sent password reset instructions to <strong>{email}</strong></p>
                <p className="text-sm mt-2">Please check your inbox and follow the instructions.</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
              >
                Send to a different email
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm pb-10 bg-primary/5 pt-6">
          <p className="text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline hover:text-accent">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 