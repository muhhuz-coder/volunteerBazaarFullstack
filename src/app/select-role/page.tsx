// src/app/select-role/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, Building } from 'lucide-react';

export default function SelectRolePage() {
  const { user, role: currentRole, setRoleInFirestore, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If auth is not loading and user is not logged in, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
    }
    // If user is logged in and already has a role, redirect to their dashboard
    if (!authLoading && user && currentRole) {
         router.push(currentRole === 'company' ? '/dashboard/company' : '/dashboard/employee');
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

    setLoading(true);
    try {
      await setRoleInFirestore(user.uid, selectedRole);
      toast({
        title: "Role Updated",
        description: `Your role has been set to ${selectedRole}.`,
      });
      // Redirect to the appropriate dashboard
      router.push(selectedRole === 'company' ? '/dashboard/company' : '/dashboard/employee');
    } catch (error) {
      console.error("Failed to set role:", error);
      toast({ title: "Error", description: "Failed to update role. Please try again.", variant: "destructive" });
      setLoading(false);
    }
    // No finally block needed for setLoading(false) as redirection happens on success
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
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Select Your Role</CardTitle>
          <CardDescription>Choose whether you are looking for jobs or hiring.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <RadioGroup
            value={selectedRole || ""}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
            className="grid grid-cols-1 gap-4"
          >
            <Label
              htmlFor="role-employee"
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${selectedRole === 'employee' ? 'border-primary' : ''}`}
            >
              <RadioGroupItem value="employee" id="role-employee" className="sr-only" />
              <UserCheck className="mb-3 h-6 w-6" />
              Job Seeker (Employee)
            </Label>
            <Label
              htmlFor="role-company"
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${selectedRole === 'company' ? 'border-primary' : ''}`}
            >
              <RadioGroupItem value="company" id="role-company" className="sr-only" />
              <Building className="mb-3 h-6 w-6" />
              Employer (Company)
            </Label>
          </RadioGroup>
           <Button onClick={handleRoleSelection} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading || !selectedRole}>
             {loading ? (
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
