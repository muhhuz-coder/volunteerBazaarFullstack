// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, KeyRound, Mail, Users, Briefcase, Home } from 'lucide-react'; 
import { Separator } from '@/components/ui/separator'; 


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp } = useAuth(); 
  const { toast } = useToast();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      toast({ title: "Signup Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    if (!role) {
      setError("Please select a role (Volunteer or Organization).");
      setLoading(false);
      toast({ title: "Signup Error", description: "Please select a role.", variant: "destructive" });
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter your name or organization name.");
      setLoading(false);
      toast({ title: "Signup Error", description: "Name cannot be empty.", variant: "destructive" });
      return;
    }

    try {
      const result = await signUp(email, password, displayName, role);

      if (result.success) {
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created. Redirecting...',
        });
        // AuthContext will handle redirection
      } else {
        setError(result.message || 'Signup failed.');
        toast({
          title: 'Signup Failed',
          description: result.message || 'An error occurred during signup.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error("Signup process failed:", err);
      setError('An unexpected error occurred during signup.');
      toast({
        title: 'Signup Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Google Sign-Up will be available in a future update.',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4 selection:bg-primary/20 selection:text-primary">
      <Button
        asChild
        variant="ghost"
        className="absolute top-4 left-4 flex items-center gap-2 hover:bg-background/60 hover:shadow-sm transition-all duration-200 group"
      >
        <Link href="/">
          <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          <span>Back to Home</span>
        </Link>
      </Button>
      
      <Card className="w-full max-w-md shadow-2xl border-primary/20 overflow-hidden rounded-xl">
        <CardHeader className="space-y-2 text-center pt-10 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <UserPlus className="mx-auto h-14 w-14 text-primary mb-3" />
          <CardTitle className="text-4xl font-bold text-primary tracking-tight">Create an Account</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">Join VolunteerBazaar today!</CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pt-8 pb-6">
          <form onSubmit={handleEmailSignup} className="space-y-6">
            <div className="grid gap-2.5">
              <Label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium text-foreground">
                {role === 'organization' ? <Briefcase className="h-4 w-4 text-muted-foreground" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                {role === 'organization' ? 'Organization Name' : 'Full Name'}
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder={role === 'organization' ? "Helping Hands Org" : "Jane Doe"}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md"
              />
            </div>
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
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground"><KeyRound className="h-4 w-4 text-muted-foreground" />Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-foreground"><KeyRound className="h-4 w-4 text-muted-foreground" />Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="role" className="flex items-center gap-2 text-sm font-medium text-foreground">I am joining as...</Label>
              <Select
                value={role || ''}
                onValueChange={(value) => setRole(value as UserRole)}
                required
              >
                <SelectTrigger id="role" className="w-full bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer" className="text-base">A Volunteer</SelectItem>
                  <SelectItem value="organization" className="text-base">An Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center pt-1.5">{error}</p>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                </>
              )}
            </Button>
          </form>

          <Separator className="my-8" />
           <Button 
            variant="outline" 
            className="w-full py-3 text-base font-semibold border-border hover:bg-muted/50 hover:border-primary/50 rounded-md shadow-sm hover:shadow-md transition-all duration-300 ease-in-out" 
            onClick={handleGoogleSignUp} 
            disabled // Keep disabled
          >
            <svg className="mr-2.5 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.5 512 0 401.5 0 265.5S110.5 19 244 19c70.5 0 132.5 29.5 177.5 78.5l-67.5 62.5C320.5 134.5 286 112 244 112c-83.5 0-151.5 67.5-151.5 153.5S160.5 419 244 419c52.5 0 96.5-20.5 126-50.5 27-27 43.5-62.5 48.5-107.5H244V261.8h244z"></path></svg>
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm pb-10 bg-primary/5 pt-6">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline hover:text-accent">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
