
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useState } from 'react'; // Import React explicitly

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
import { useToast } from '@/hooks/use-toast';
// Updated imports: submitApplication -> submitVolunteerApplication, Job -> Opportunity, JobApplication -> VolunteerApplication
import { type Opportunity, type VolunteerApplication } from '@/services/job-board';
import { Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

// Define the validation schema using Zod (adjusted fields/messages)
const formSchema = z.object({
  applicantName: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  applicantEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  attachment: z.instanceof(File, { message: 'Attachment is required.' })
           .refine(file => file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`) // 5MB size limit
           .refine(
             file => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"].includes(file.type),
             "Only PDF, DOC, DOCX, JPG, PNG formats are supported."
           ).optional(), // Made attachment optional
  statementOfInterest: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof formSchema>;

interface VolunteerApplicationFormProps {
  opportunity: Opportunity;
}

export function VolunteerApplicationForm({ opportunity }: VolunteerApplicationFormProps) {
  const { toast } = useToast();
  const { user, submitApplication } = useAuth(); // Get user and submitApplication from context
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: user?.displayName || '', // Pre-fill if user is logged in
      applicantEmail: user?.email || '', // Pre-fill if user is logged in
      statementOfInterest: '',
      // attachment: undefined,
    },
  });

 // Effect to update form defaults if user data loads after initial render
 React.useEffect(() => {
    if (user) {
      form.reset({
        applicantName: user.displayName || '',
        applicantEmail: user.email || '',
        statementOfInterest: form.getValues('statementOfInterest'), // Keep existing statement
        attachment: form.getValues('attachment'), // Keep existing file selection
      });
    }
  }, [user, form]);


 async function onSubmit(values: ApplicationFormValues) {
    if (!user || user.role !== 'volunteer') {
        toast({
            title: 'Login Required',
            description: 'Please log in as a volunteer to submit an application.',
            variant: 'destructive',
        });
        return;
    }

    setIsSubmitting(true);
    console.log('Submitting volunteer application:', values);

    let attachmentUrl = '';
    if (values.attachment) {
        // Simulate file upload -> In a real app, upload and get URL
        attachmentUrl = `simulated/path/to/${values.attachment.name}`;
    }

    // Prepare data for the context function
    const applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'> = {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title, // Add opportunity title
      applicantName: values.applicantName,
      applicantEmail: values.applicantEmail,
      resumeUrl: attachmentUrl,
      coverLetter: values.statementOfInterest || '',
    };

    try {
      // Use the submitApplication function from AuthContext
      const result = await submitApplication(applicationData);

      if (result.success) {
        toast({
          title: 'Interest Submitted',
          description: result.message,
        });
        form.reset(); // Reset form on success
      } else {
         toast({
           title: 'Submission Failed',
           description: result.message,
           variant: 'destructive',
         });
      }
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your interest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

   // Disable form if user is not a volunteer
   const isVolunteer = user?.role === 'volunteer';


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         {!isVolunteer && (
            <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
             You must be logged in as a volunteer to apply.
            </p>
          )}
        {/* Applicant Name */}
        <FormField
          control={form.control}
          name="applicantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} className="bg-background" disabled={!isVolunteer} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Applicant Email */}
        <FormField
          control={form.control}
          name="applicantEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane.doe@example.com" {...field} className="bg-background" disabled={!isVolunteer} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Attachment Upload (Optional) */}
        <FormField
          control={form.control}
          name="attachment"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Relevant Attachment (Optional)</FormLabel>
              <FormControl>
                 <div className="relative">
                    <Input
                      {...fieldProps}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(event) => {
                        onChange(event.target.files ? event.target.files[0] : undefined);
                      }}
                      value={value ? undefined : ''}
                      className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-background"
                       disabled={!isVolunteer}
                    />
                     {value?.name && <span className="text-sm text-muted-foreground mt-1 block">{value.name}</span>}
                    <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 </div>
              </FormControl>
              <FormDescription>Upload a resume, portfolio, or relevant document (PDF, DOC, DOCX, JPG, PNG, max 5MB).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Statement of Interest */}
        <FormField
          control={form.control}
          name="statementOfInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statement of Interest (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us why you're interested in this volunteer opportunity..."
                  className="resize-none bg-background"
                  rows={5}
                  {...field}
                   disabled={!isVolunteer}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting || !isVolunteer} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Interest'
          )}
        </Button>
      </form>
    </Form>
  );
}
