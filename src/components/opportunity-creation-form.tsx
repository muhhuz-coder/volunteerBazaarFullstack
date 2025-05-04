
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createOpportunityAction } from '@/actions/job-board-actions';
import { opportunityCategories } from '@/config/constants'; // Import categories

// Validation schema
const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  location: z.string().min(3, 'Location must be specified.'),
  commitment: z.string().min(3, 'Commitment details are required.'),
  category: z.string().refine(val => val !== 'All' && opportunityCategories.includes(val), {
    message: 'Please select a valid category.',
  }),
  pointsAwarded: z.coerce.number().min(0, 'Points must be 0 or greater.').optional(), // Optional number, coerce turns string input to number
});

type OpportunityFormValues = z.infer<typeof formSchema>;

export function OpportunityCreationForm() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      commitment: '',
      category: '',
      pointsAwarded: 0,
    },
  });

  async function onSubmit(values: OpportunityFormValues) {
    if (!user || role !== 'organization') {
      toast({ title: 'Unauthorized', description: 'Only organizations can create opportunities.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await createOpportunityAction(
        {
          ...values,
          organization: user.displayName, // Set from context
          organizationId: user.id, // Set from context
          pointsAwarded: values.pointsAwarded ?? 0, // Ensure pointsAwarded is a number
        },
        user.id,
        user.displayName
      );

      if (result.success && result.opportunity) {
        toast({ title: 'Success', description: `Opportunity "${result.opportunity.title}" created.` });
        form.reset();
        // Optionally redirect to the dashboard or the new opportunity page
        router.push('/dashboard/organization');
        router.refresh(); // Refresh server components
      } else {
        throw new Error(result.message || 'Failed to create opportunity.');
      }
    } catch (error: any) {
      console.error('Opportunity creation failed:', error);
      toast({ title: 'Error', description: error.message || 'Could not create opportunity.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user || role !== 'organization') {
     return <p className="text-destructive text-center">You must be logged in as an organization to post opportunities.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opportunity Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Community Garden Helper" {...field} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the role, responsibilities, and impact..." className="resize-none bg-background" rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., City Park or Remote" {...field} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Commitment */}
        <FormField
          control={form.control}
          name="commitment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Commitment</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2 hours/week, Weekends only, Event-based" {...field} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area of Interest</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {opportunityCategories.filter(cat => cat !== 'All').map((cat) => ( // Exclude 'All'
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

         {/* Points Awarded (Optional) */}
         <FormField
           control={form.control}
           name="pointsAwarded"
           render={({ field }) => (
             <FormItem>
               <FormLabel>Points Awarded (Optional)</FormLabel>
               <FormControl>
                 <Input type="number" placeholder="e.g., 50" {...field} className="bg-background" min="0" />
               </FormControl>
               <FormDescription>Points awarded to volunteers upon completion/acceptance.</FormDescription>
               <FormMessage />
             </FormItem>
           )}
         />


        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Opportunity'
          )}
        </Button>
      </form>
    </Form>
  );
}
