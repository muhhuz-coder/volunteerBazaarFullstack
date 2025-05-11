
// src/app/onboarding/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, ShieldQuestion, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from "@/components/ui/progress"


const onboardingSchema = z.object({
  skills: z.string().min(1, { message: "Please list at least one skill or type 'None'." }),
  causes: z.string().min(1, { message: "Please list at least one cause or type 'None'." }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 'welcome', title: 'Welcome!', icon: Sparkles },
  { id: 'details', title: 'Your Interests & Skills', icon: ShieldQuestion },
  { id: 'complete', title: 'All Set!', icon: CheckCircle },
];

export default function OnboardingPage() {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      skills: user?.skills?.join(', ') || '',
      causes: user?.causes?.join(', ') || '',
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.onboardingCompleted) {
        // If onboarding is already completed, redirect to dashboard
        const targetDashboard = user.role === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer';
        router.push(targetDashboard);
      }
    }
  }, [user, authLoading, router]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmitPreferences = async (data: OnboardingFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const skillsArray = data.skills.split(',').map(s => s.trim()).filter(s => s);
      const causesArray = data.causes.split(',').map(c => c.trim()).filter(c => c);

      const result = await updateUserProfile({
        skills: skillsArray,
        causes: causesArray,
        onboardingCompleted: true, // Mark onboarding as complete
      });

      if (result.success) {
        toast({ title: "Preferences Saved!", description: "Your profile is updated." });
        handleNextStep(); // Move to completion step
      } else {
        toast({ title: "Error", description: result.message || "Could not save preferences.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishOnboarding = () => {
    const targetDashboard = user?.role === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer';
    router.push(targetDashboard);
  };
  
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (authLoading || !user || user.onboardingCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/70">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg shadow-2xl border-primary/20 overflow-hidden">
          <CardHeader className="bg-primary/5 text-center py-8 border-b border-primary/10">
             <CurrentIcon className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground mt-1">
              {currentStep === 0 && `Hi ${user.displayName}! Let's get you set up.`}
              {currentStep === 1 && "Tell us what you're passionate about."}
              {currentStep === 2 && "You're all set to make a difference!"}
            </CardDescription>
          </CardHeader>
          
          <Progress value={progressPercentage} className="w-full h-1.5 rounded-none bg-primary/10" indicatorClassName="bg-gradient-to-r from-accent to-primary" />


          <CardContent className="p-6 md:p-8 space-y-8 min-h-[250px] flex flex-col justify-center">
            {currentStep === 0 && (
              <div className="text-center space-y-4">
                <p className="text-lg text-foreground">
                  Welcome to VolunteerBazaar! We're excited to have you.
                </p>
                <p className="text-muted-foreground">
                  This quick setup will help us tailor your experience.
                </p>
                <Button onClick={handleNextStep} size="lg" className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-transform hover:scale-105">
                  Let's Go! <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {currentStep === 1 && (
              <form onSubmit={handleSubmit(onSubmitPreferences)} className="space-y-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="skills" className="flex items-center gap-1.5 text-foreground"><Sparkles className="h-4 w-4 text-muted-foreground" /> Your Skills</Label>
                  <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => <Textarea id="skills" placeholder="e.g., Writing, Event Planning, Coding" {...field} className="resize-none bg-background border-border focus:border-primary focus:ring-primary/30" rows={3} />}
                  />
                  <p className="text-xs text-muted-foreground">Enter skills separated by commas. Type 'None' if not applicable.</p>
                  {errors.skills && <p className="text-sm text-destructive">{errors.skills.message}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="causes" className="flex items-center gap-1.5 text-foreground"><ShieldQuestion className="h-4 w-4 text-muted-foreground" /> Causes You Care About</Label>
                  <Controller
                    name="causes"
                    control={control}
                    render={({ field }) => <Textarea id="causes" placeholder="e.g., Environment, Education, Animal Welfare" {...field} className="resize-none bg-background border-border focus:border-primary focus:ring-primary/30" rows={3} />}
                  />
                   <p className="text-xs text-muted-foreground">Enter causes separated by commas. Type 'None' if not applicable.</p>
                  {errors.causes && <p className="text-sm text-destructive">{errors.causes.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold shadow-md transition-transform hover:scale-105">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Save & Continue
                </Button>
              </form>
            )}

            {currentStep === 2 && (
              <div className="text-center space-y-6">
                <p className="text-xl font-semibold text-primary">
                  Thank you, {user.displayName}!
                </p>
                <p className="text-muted-foreground">
                  Your profile is now complete. You can start exploring opportunities and making an impact.
                </p>
                <Button onClick={handleFinishOnboarding} size="lg" className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-transform hover:scale-105">
                  Go to Dashboard <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
         <div className="mt-4 text-xs text-muted-foreground text-center">
             Step {currentStep + 1} of {steps.length}
         </div>
      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
       </footer>
    </div>
  );
}
