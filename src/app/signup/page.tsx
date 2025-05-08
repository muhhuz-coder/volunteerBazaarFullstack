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
import { Loader2, UserPlus, KeyRound, Mail, Users, Briefcase } from 'lucide-react'; // Added more icons
import { Separator } from '@/components/ui/separator'; // Added Separator


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUpWithEmail } = useAuth(); // Use signUpWithEmail for local auth
  const { toast } = useToast();

  // REMOVED: Google Sign-In related state and handlers
  // const [googleLoading, setGoogleLoading] = useState(false);


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
      const result = await signUpWithEmail(email, password, displayName, role);

      if (result.success) {
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created. Redirecting...',
        });
        // AuthContext's onAuthStateChanged will handle redirection to /select-role or dashboard
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

  // REMOVED: handleGoogleSignUp function

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary via-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-xl border overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-8 pb-6 bg-primary/5">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">Create an Account</CardTitle>
          <CardDescription className="text-base text-muted-foreground">Join VolunteerBazaar today!</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-6 pb-4">
          <form onSubmit={handleEmailSignup} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="flex items-center gap-2 text-sm">
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
                className="bg-background border-border focus:border-primary focus:ring-primary/50 h-10 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-primary/50 h-10 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4 text-muted-foreground" />Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background border-border focus:border-primary focus:ring-primary/50 h-10 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4 text-muted-foreground" />Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-primary/50 h-10 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role" className="flex items-center gap-2 text-sm">I am a...</Label>
              <Select
                value={role || ''}
                onValueChange={(value) => setRole(value as UserRole)}
                required
              >
                <SelectTrigger id="role" className="w-full bg-background border-border focus:border-primary focus:ring-primary/50 h-10 text-sm">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer" className="text-sm">Volunteer</SelectItem>
                  <SelectItem value="organization" className="text-sm">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center pt-1">{error}</p>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold transition-all duration-300 ease-in-out hover:shadow-lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </>
              )}
            </Button>
          </form>

          {/* REMOVED: Google Sign-Up Button and Separator Logic
          <Separator className="my-6" />
           <Button 
            variant="outline" 
            className="w-full py-3 text-base font-semibold border-border hover:bg-muted/50 transition-all duration-300 ease-in-out hover:shadow-lg" 
            onClick={handleGoogleSignUp} 
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.5 512 0 401.5 0 265.5S110.5 19 244 19c70.5 0 132.5 29.5 177.5 78.5l-67.5 62.5C320.5 134.5 286 112 244 112c-83.5 0-151.5 67.5-151.5 153.5S160.5 419 244 419c52.5 0 96.5-20.5 126-50.5 27-27 43.5-62.5 48.5-107.5H244V261.8h244z"></path></svg>
                Sign up with Google
              </>
            )}
          </Button>
           */}
        </CardContent>
        <CardFooter className="text-center text-sm pb-8 bg-primary/5 pt-4">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
