// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth, UserRole } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // Add display name state
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setRoleInFirestore } = useAuth();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
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
        setError("Please select a role (Employee or Company).");
        setLoading(false);
        toast({ title: "Signup Error", description: "Please select a role.", variant: "destructive" });
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, { displayName: displayName || email.split('@')[0] }); // Use email prefix if no name

      // Set the role in Firestore immediately after signup
      await setRoleInFirestore(user.uid, role);

      toast({
        title: 'Signup Successful',
        description: 'Your account has been created.',
      });

      // Redirect based on role
      if (role === 'company') {
        router.push('/dashboard/company');
      } else {
        router.push('/dashboard/employee');
      }

    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err.message || 'Failed to sign up. Please try again.');
      toast({
        title: 'Signup Failed',
        description: err.message || 'An error occurred during signup.',
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
          <CardTitle className="text-2xl font-bold text-primary">Create an Account</CardTitle>
          <CardDescription>Enter your details to sign up</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSignup} className="grid gap-4">
             <div className="grid gap-2">
               <Label htmlFor="displayName">Full Name or Company Name</Label>
               <Input
                 id="displayName"
                 type="text"
                 placeholder="John Doe or Acme Inc."
                 value={displayName}
                 onChange={(e) => setDisplayName(e.target.value)}
                 required
                 className="bg-background"
               />
             </div>
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
                minLength={6}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>
             <div className="grid gap-2">
               <Label htmlFor="role">I am a...</Label>
               <Select
                 value={role || ''}
                 onValueChange={(value) => setRole(value as UserRole)}
                 required
               >
                 <SelectTrigger id="role" className="w-full bg-background">
                   <SelectValue placeholder="Select your role" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="employee">Job Seeker (Employee)</SelectItem>
                   <SelectItem value="company">Employer (Company)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             {error && (
               <p className="text-sm text-destructive text-center">{error}</p>
             )}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
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
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
