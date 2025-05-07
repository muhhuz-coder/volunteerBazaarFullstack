// src/components/dashboard/organization/attendance-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Star, Clock } from 'lucide-react';
import type { VolunteerApplication } from '@/services/job-board';
import { recordVolunteerPerformanceAction } from '@/actions/application-actions';

const performanceSchema = z.object({
  attendance: z.enum(['present', 'absent', 'pending'], {
    required_error: "Attendance status is required.",
  }),
  orgRating: z.coerce.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5").optional(),
  hoursLoggedByOrg: z.coerce.number().min(0, "Hours must be 0 or positive.").optional(),
});

type PerformanceFormValues = z.infer<typeof performanceSchema>;

interface AttendanceFormProps {
  application: VolunteerApplication;
  onFormSubmit?: (updatedApplication: VolunteerApplication) => void; // Callback after submission
}

export function AttendanceForm({ application, onFormSubmit }: AttendanceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceSchema),
    defaultValues: {
      attendance: application.attendance || 'pending',
      orgRating: application.orgRating || undefined,
      hoursLoggedByOrg: application.hoursLoggedByOrg === null ? undefined : application.hoursLoggedByOrg, // Ensure null becomes undefined
    },
  });

  async function onSubmit(values: PerformanceFormValues) {
    setIsSubmitting(true);
    try {
      const result = await recordVolunteerPerformanceAction(application.id, {
        attendance: values.attendance,
        orgRating: values.orgRating,
        hoursLoggedByOrg: values.hoursLoggedByOrg,
      });

      if (result.success && result.updatedApplication) {
        toast({ title: 'Success', description: 'Volunteer performance recorded.' });
        if (onFormSubmit) {
          onFormSubmit(result.updatedApplication);
        }
        // Optionally close a dialog or reset form if needed here
      } else {
        throw new Error(result.message || 'Failed to record performance.');
      }
    } catch (error: any) {
      console.error('Performance recording failed:', error);
      toast({ title: 'Error', description: error.message || 'Could not record performance.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="attendance"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Attendance</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="present" />
                    </FormControl>
                    <FormLabel className="font-normal">Present</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="absent" />
                    </FormControl>
                    <FormLabel className="font-normal">Absent</FormLabel>
                  </FormItem>
                   <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="pending" />
                    </FormControl>
                    <FormLabel className="font-normal">Pending/Not Applicable</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orgRating"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Star className="h-4 w-4" /> Volunteer Rating (1-5, Optional)</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString() ?? ""} // Ensure value is controlled
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Rate volunteer performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Rating</SelectItem> 
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} Star{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hoursLoggedByOrg"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> Hours Logged (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 3.5"
                  value={field.value ?? ''} // Use empty string if field.value is undefined or null
                  onChange={e => {
                    const rawValue = e.target.value;
                    if (rawValue === '') {
                      field.onChange(undefined); // Set to undefined if input is empty
                    } else {
                      const num = parseFloat(rawValue);
                      field.onChange(isNaN(num) ? undefined : num); // Set to number or undefined if NaN
                    }
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="bg-background"
                  min="0"
                  step="0.1"
                />
              </FormControl>
              <FormDescription>Enter the number of hours the volunteer contributed.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Record Performance'
          )}
        </Button>
      </form>
    </Form>
  );
}
