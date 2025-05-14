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
import type { Opportunity, VolunteerApplication } from '@/services/job-board';
import { Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

// Define the validation schema using Zod (adjusted fields/messages)
// Allow FileList for input type, refine to File for validation
const formSchema = z.object({
  applicantName: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  applicantEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  attachment: z
    .custom<FileList>() // Accept FileList from input
    .optional()
    .refine(
      (fileList) => !fileList || fileList.length === 0 || fileList[0].size <= 5 * 1024 * 1024,
      `Max file size is 5MB.`
    ) // 5MB size limit
    .refine(
      (fileList) =>
        !fileList ||
        fileList.length === 0 ||
        ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"].includes(fileList[0].type),
      "Only PDF, DOC, DOCX, JPG, PNG formats are supported."
    ),
  statementOfInterest: z.string().optional(),
});


type ApplicationFormValues = z.infer<typeof formSchema>;

interface VolunteerApplicationFormProps {
  opportunity: Opportunity;
}

// Helper function to convert File to Base64 Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


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
      attachment: undefined, // Default file input value should be undefined
    },
  });

 // Effect to update form defaults if user data loads after initial render
 React.useEffect(() => {
    if (user) {
      // Only reset fields if they haven't been touched by the user yet,
      // or always reset non-file fields. Be careful not to overwrite user input unintentionally.
      // For file inputs, we generally don't reset programmatically.
      form.reset({
        applicantName: form.formState.dirtyFields.applicantName ? form.getValues('applicantName') : user.displayName || '',
        applicantEmail: form.formState.dirtyFields.applicantEmail ? form.getValues('applicantEmail') : user.email || '',
        statementOfInterest: form.getValues('statementOfInterest'), // Keep existing statement
        // Don't reset attachment - managed by user interaction
      }, { keepValues: true }); // Prevent resetting untouched file input
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

    let attachmentDataUri = '';
    // Get the File object from the FileList
    const file = values.attachment?.[0];

    if (file) {
        try {
          console.log('Converting file to Data URI...');
          attachmentDataUri = await fileToDataUri(file);
          console.log('File converted to Data URI (first 100 chars):', attachmentDataUri.substring(0, 100) + '...');
        } catch (error) {
          console.error('Error converting file to Data URI:', error);
          toast({
            title: 'File Processing Error',
            description: 'Could not process the attached file. Please try again.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
    }

    // Prepare data for the context function
    const applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'> = {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title, // Add opportunity title
      applicantName: values.applicantName,
      applicantEmail: values.applicantEmail,
      resumeUrl: attachmentDataUri, // Use the Data URI string
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
      
      // Check if the error message indicates a duplicate application
      const errorMessage = error instanceof Error ? error.message : 'There was an error submitting your interest. Please try again.';
      const isDuplicateApplication = typeof errorMessage === 'string' && 
                                    (errorMessage.includes('already applied') || 
                                     errorMessage.includes('duplicate application'));
      
      toast({
        title: isDuplicateApplication ? 'Already Applied' : 'Submission Failed',
        description: errorMessage,
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
          render={({ field: { onChange, value, ...fieldProps } }) => {
            // Get the File object from the FileList for display purposes
            const currentFile = value?.[0];
            return (
              <FormItem>
                <FormLabel>Relevant Attachment (Optional)</FormLabel>
                <FormControl>
                   <div className="relative">
                      <Input
                        {...fieldProps} // Pass rest props like name, onBlur, ref
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        // Use the form's register method directly for file inputs
                        {...form.register("attachment")}
                        // We don't set `value` for file inputs
                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-background"
                        disabled={!isVolunteer}
                      />
                      {/* Display selected file name */}
                      {currentFile && <span className="text-sm text-muted-foreground mt-1 block">{currentFile.name}</span>}
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                   </div>
                </FormControl>
                <FormDescription>Upload a resume, portfolio, or relevant document (PDF, DOC, DOCX, JPG, PNG, max 5MB).</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
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
