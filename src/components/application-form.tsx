'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';

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
import { submitVolunteerApplication, type Opportunity, type VolunteerApplication } from '@/services/job-board';
import { Loader2, Upload } from 'lucide-react';

// Define the validation schema using Zod (adjusted fields/messages)
const formSchema = z.object({
  applicantName: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  applicantEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  // Changed 'resume' to 'attachment' - kept optional and simplified validation for now
  attachment: z.instanceof(File, { message: 'Attachment is required.' })
           .refine(file => file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`) // 5MB size limit
           .refine(
             // Allow common document and image types
             file => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"].includes(file.type),
             "Only PDF, DOC, DOCX, JPG, PNG formats are supported."
           ).optional(), // Made attachment optional
  // Changed 'coverLetter' to 'statementOfInterest' - kept optional
  statementOfInterest: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof formSchema>;

// Renamed props interface
interface VolunteerApplicationFormProps {
  // Use Opportunity type
  opportunity: Opportunity;
}

// Renamed component from ApplicationForm to VolunteerApplicationForm
export function VolunteerApplicationForm({ opportunity }: VolunteerApplicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: '',
      applicantEmail: '',
      statementOfInterest: '', // Updated field name
      // attachment: undefined, // No default for file input
    },
  });

 async function onSubmit(values: ApplicationFormValues) {
    setIsSubmitting(true);
    console.log('Submitting volunteer application:', values);

    // Handle potential file upload (if an attachment was provided)
    let attachmentUrl = '';
    if (values.attachment) {
        // In a real app, you would handle the file upload here, get the URL.
        // For this example, we'll simulate success.
        // const uploadedUrl = await uploadFile(values.attachment); // Placeholder
        attachmentUrl = `simulated/path/to/${values.attachment.name}`; // Simulate a URL
    }


    // Use VolunteerApplication type
    const applicationData: Omit<VolunteerApplication, 'id'> = {
      // Use opportunityId
      opportunityId: opportunity.id,
      applicantName: values.applicantName,
      applicantEmail: values.applicantEmail,
      // Use attachmentUrl (can be empty if no file)
      resumeUrl: attachmentUrl, // Keep the field name for now, represents the attachment
      // Use statementOfInterest
      coverLetter: values.statementOfInterest || '', // Keep the field name for now
    };

    try {
       // Use updated submission function
      const result = await submitVolunteerApplication(applicationData);
      toast({
        // Updated success title/description
        title: 'Interest Submitted',
        description: result,
      });
      form.reset(); // Reset form on success
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Submission Failed',
        // Updated error description
        description: 'There was an error submitting your interest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Applicant Name */}
        <FormField
          control={form.control}
          name="applicantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} className="bg-background" />
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
                <Input type="email" placeholder="jane.doe@example.com" {...field} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Attachment Upload (Optional) */}
         {/* Updated field name, label, and description */}
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" // Updated accepted types
                      onChange={(event) => {
                        // Handle case where user cancels file selection
                        onChange(event.target.files ? event.target.files[0] : undefined);
                      }}
                      // Clear the value visually if the field value is null/undefined
                      value={value ? undefined : ''}
                      className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-background"
                    />
                     {/* Display filename if selected */}
                     {value?.name && <span className="text-sm text-muted-foreground mt-1 block">{value.name}</span>}
                    <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 </div>
              </FormControl>
               {/* Updated description */}
              <FormDescription>Upload a resume, portfolio, or relevant document (PDF, DOC, DOCX, JPG, PNG, max 5MB).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Statement of Interest */}
         {/* Updated field name, label, and placeholder */}
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
         {/* Updated button text */}
        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
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
