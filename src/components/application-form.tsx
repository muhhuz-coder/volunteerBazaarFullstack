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
import { submitApplication, type Job, type JobApplication } from '@/services/job-board';
import { Loader2, Upload } from 'lucide-react';

// Define the validation schema using Zod
const formSchema = z.object({
  applicantName: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  applicantEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  resume: z.instanceof(File, { message: 'Resume is required.' })
           .refine(file => file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`) // 5MB size limit
           .refine(
             file => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type),
             "Only .pdf, .doc, .docx formats are supported."
           ),
  coverLetter: z.string().optional(), // Cover letter is optional
});

type ApplicationFormValues = z.infer<typeof formSchema>;

interface ApplicationFormProps {
  job: Job;
}

export function ApplicationForm({ job }: ApplicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: '',
      applicantEmail: '',
      coverLetter: '',
      // resume: undefined, // No default for file input
    },
  });

 async function onSubmit(values: ApplicationFormValues) {
    setIsSubmitting(true);
    console.log('Submitting application:', values);

    // In a real app, you would handle the file upload here,
    // get the URL, and then submit the application data.
    // For this example, we'll simulate success.
    // const resumeUrl = await uploadFile(values.resume); // Placeholder for actual upload logic

    const applicationData: JobApplication = {
      id: crypto.randomUUID(), // Generate a temporary ID
      jobId: job.id,
      applicantName: values.applicantName,
      applicantEmail: values.applicantEmail,
      resumeUrl: `simulated/path/to/${values.resume.name}`, // Simulate a URL
      coverLetter: values.coverLetter || '',
    };

    try {
      const result = await submitApplication(applicationData);
      toast({
        title: 'Application Submitted',
        description: result,
      });
      form.reset(); // Reset form on success
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your application. Please try again.',
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
                <Input placeholder="John Doe" {...field} className="bg-background" />
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
                <Input type="email" placeholder="john.doe@example.com" {...field} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Resume Upload */}
        <FormField
          control={form.control}
          name="resume"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Resume</FormLabel>
              <FormControl>
                 <div className="relative">
                    <Input
                      {...fieldProps}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(event) => {
                        onChange(event.target.files && event.target.files[0]);
                      }}
                      className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-background"
                    />
                    <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 </div>
              </FormControl>
              <FormDescription>Upload your resume (PDF, DOC, DOCX, max 5MB).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Cover Letter */}
        <FormField
          control={form.control}
          name="coverLetter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us why you're a great fit for this role..."
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
        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </form>
    </Form>
  );
}
