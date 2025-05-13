// src/app/select-role/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
// Updated icons
import { Loader2, HandHeart, Building2, Home } from 'lucide-react';

export default function SelectRolePage() {
  // Use 'loading' from useAuth directly for initial auth state check
  const { user, role: currentRole, setRoleAndUpdateUser, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [actionLoading, setActionLoading] = useState(false); // Separate loading state for the button action
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect immediately if not loading and user is not logged in
    if (!authLoading && !user) {
      router.push('/login');
      return; // Stop further execution in this effect
    }
    // Redirect immediately if not loading and user already has a role (updated roles)
    if (!authLoading && user && currentRole) {
         router.push(currentRole === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer');
         return; // Stop further execution in this effect
    }
     // Pre-fill selection if a role exists but redirection didn't happen (edge case)
     if (currentRole) {
        setSelectedRole(currentRole);
     }
  }, [user, currentRole, authLoading, router]);


  const handleRoleSelection = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      router.push('/login');
      return;
    }
    if (!selectedRole) {
      toast({ title: "Selection Required", description: "Please select a role.", variant: "destructive" });
      return;
    }

    setActionLoading(true); // Use separate loading state for the action
    try {
      // Use the simplified role setting function from the mock context
      await setRoleAndUpdateUser(selectedRole);
      toast({
        title: "Role Updated",
        description: `Your role has been set to ${selectedRole}.`,
      });
      // Redirect to the appropriate dashboard (updated roles)
      router.push(selectedRole === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer');
    } catch (error) {
      console.error("Failed to set role:", error);
      toast({ title: "Error", description: "Failed to update role. Please try again.", variant: "destructive" });
      setActionLoading(false); // Ensure loading state is turned off on error
    }
    // No finally block needed for setActionLoading(false) as redirection happens on success
  };

  // Show loading indicator while checking auth state or if user already has a role
  if (authLoading || (user && currentRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render role selection form if user is logged in but has no role
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
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
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Select Your Role</CardTitle>
           {/* Updated description */}
          <CardDescription>Choose whether you want to volunteer or represent an organization.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <RadioGroup
            value={selectedRole || ""}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
            className="grid grid-cols-1 gap-4"
          >
            <Label
              htmlFor="role-volunteer" // Updated ID
              // Updated border check and text
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${selectedRole === 'volunteer' ? 'border-primary' : ''}`}
            >
               {/* Updated value and ID */}
              <RadioGroupItem value="volunteer" id="role-volunteer" className="sr-only" />
               {/* Updated icon and text */}
              <HandHeart className="mb-3 h-6 w-6" />
              Volunteer
            </Label>
            <Label
              htmlFor="role-organization" // Updated ID
              // Updated border check and text
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${selectedRole === 'organization' ? 'border-primary' : ''}`}
            >
               {/* Updated value and ID */}
              <RadioGroupItem value="organization" id="role-organization" className="sr-only" />
               {/* Updated icon and text */}
              <Building2 className="mb-3 h-6 w-6" />
              Organization
            </Label>
          </RadioGroup>
           <Button onClick={handleRoleSelection} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={actionLoading || !selectedRole}>
             {actionLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Saving...
               </>
             ) : (
               'Confirm Role & Continue'
             )}
           </Button>
        </CardContent>
      </Card>
    </div>
  );
}
