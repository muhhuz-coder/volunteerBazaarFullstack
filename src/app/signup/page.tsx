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
import { Loader2, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // Changed label below
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp } = useAuth(); // Use signUp from mock context
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
        // Updated error message
        setError("Please select a role (Volunteer or Organization).");
        setLoading(false);
        toast({ title: "Signup Error", description: "Please select a role.", variant: "destructive" });
        return;
    }
     if (!displayName.trim()) {
         // Updated error message
        setError("Please enter your name or organization name.");
        setLoading(false);
        toast({ title: "Signup Error", description: "Name cannot be empty.", variant: "destructive" });
        return;
      }


    try {
      // Use the mock signUp function
      const result = await signUp(email, password, displayName, role);

      if (result.success) {
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created.',
        });

        // Redirect based on the selected role (updated roles)
        if (role === 'organization') {
          router.push('/dashboard/organization');
        } else { // 'volunteer'
          router.push('/dashboard/volunteer');
        }
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary via-background to-secondary p-4"> {/* Added gradient background */}
      <Card className="w-full max-w-md shadow-xl border"> {/* Increased shadow */}
        <CardHeader className="space-y-2 text-center pt-8 pb-4"> {/* Adjusted padding */}
           <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" /> {/* Added icon */}
          <CardTitle className="text-2xl font-bold text-primary">Create an Account</CardTitle>
          <CardDescription>Join Volunteer Connect today!</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6"> {/* Adjusted padding */}
          <form onSubmit={handleSignup} className="space-y-5"> {/* Increased spacing */}
             <div className="grid gap-1.5"> {/* Adjusted gap */}
                 {/* Updated label */}
               <Label htmlFor="displayName">Full Name or Organization Name</Label>
               <Input
                 id="displayName"
                 type="text"
                 placeholder="Jane Doe or Helping Hands Org" // Updated placeholder
                 value={displayName}
                 onChange={(e) => setDisplayName(e.target.value)}
                 required
                 className="bg-background border-border focus:border-primary focus:ring-primary/50" // Added focus styles
               />
             </div>
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
                minLength={6} // Keep basic validation
                className="bg-background border-border focus:border-primary focus:ring-primary/50" // Added focus styles
              />
            </div>
            <div className="grid gap-1.5"> {/* Adjusted gap */}
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background border-border focus:border-primary focus:ring-primary/50" // Added focus styles
              />
            </div>
             <div className="grid gap-1.5"> {/* Adjusted gap */}
               <Label htmlFor="role">I am a...</Label>
               <Select
                 value={role || ''}
                 onValueChange={(value) => setRole(value as UserRole)}
                 required // Keep required validation
               >
                 <SelectTrigger id="role" className="w-full bg-background border-border focus:border-primary focus:ring-primary/50"> {/* Added focus styles */}
                   <SelectValue placeholder="Select your role" />
                 </SelectTrigger>
                 <SelectContent>
                    {/* Updated role options */}
                   <SelectItem value="volunteer">Volunteer</SelectItem>
                   <SelectItem value="organization">Organization</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             {error && (
               <p className="text-sm text-destructive text-center pt-1">{error}</p> // Added top padding
             )}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base font-semibold" disabled={loading}> {/* Increased padding/font size */}
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
        <CardFooter className="text-center text-sm pb-8"> {/* Adjusted padding */}
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
