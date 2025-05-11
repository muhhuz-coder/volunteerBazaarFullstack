
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { Calendar as CalendarIcon, CalendarDays, Sparkles } from "lucide-react"; 
import Image from 'next/image';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2 } from 'lucide-react'; // Added Trash2 for removing image
import { useAuth } from '@/context/AuthContext';
import { createOpportunityAction, updateOpportunityAction } from '@/actions/job-board-actions';
import { opportunityCategories } from '@/config/constants'; 
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/services/job-board'; // Import Opportunity type

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

// Validation schema
const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  location: z.string().min(3, 'Location must be specified.'),
  commitment: z.string().min(3, 'Commitment details are required.'),
  category: z.string().refine(val => val !== 'All' && opportunityCategories.includes(val), {
    message: 'Please select a valid category.',
  }),
  requiredSkills: z.string().optional(), // Textarea for comma-separated skills
  pointsAwarded: z.coerce.number().min(0, 'Points must be 0 or greater.').optional(),
  applicationDeadline: z.date().optional(),
  eventStartDate: z.date().refine(val => val !== undefined, {message: "Event start date is required."}),
  eventEndDate: z.date().refine(val => val !== undefined, {message: "Event end date is required."}),
  image: z
    .custom<FileList>()
    .optional()
    .refine(
      (fileList) => !fileList || fileList.length === 0 || fileList[0].size <= 2 * 1024 * 1024,
      `Max image size is 2MB.`
    )
    .refine(
      (fileList) =>
        !fileList ||
        fileList.length === 0 ||
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(fileList[0].type),
      "Only JPG, PNG, WEBP, GIF formats are supported."
    ),
}).refine(data => {
  if (data.eventStartDate && data.eventEndDate) {
    return data.eventEndDate >= data.eventStartDate;
  }
  return true;
}, {
  message: "Event end date must be after or on the start date.",
  path: ["eventEndDate"], 
});

type OpportunityFormValues = z.infer<typeof formSchema>;

interface OpportunityCreationFormProps {
  mode?: 'create' | 'edit';
  initialData?: Opportunity | null; // Null if not found or error
  opportunityId?: string; // Required for edit mode
}

export function OpportunityCreationForm({
  mode = 'create',
  initialData,
  opportunityId,
}: OpportunityCreationFormProps) {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null | undefined>(initialData?.imageUrl);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === 'edit' && initialData ? {
      title: initialData.title || '',
      description: initialData.description || '',
      location: initialData.location || '',
      commitment: initialData.commitment || '',
      category: initialData.category || '',
      requiredSkills: initialData.requiredSkills?.join(', ') || '',
      pointsAwarded: initialData.pointsAwarded ?? 0,
      applicationDeadline: initialData.applicationDeadline ? new Date(initialData.applicationDeadline) : undefined,
      eventStartDate: initialData.eventStartDate ? new Date(initialData.eventStartDate) : undefined,
      eventEndDate: initialData.eventEndDate ? new Date(initialData.eventEndDate) : undefined,
      image: undefined, // Image is handled separately via currentImageUrl and new file upload
    } : {
      title: '',
      description: '',
      location: '',
      commitment: '',
      category: '',
      requiredSkills: '',
      pointsAwarded: 0,
      applicationDeadline: undefined,
      eventStartDate: undefined,
      eventEndDate: undefined,
      image: undefined,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        title: initialData.title || '',
        description: initialData.description || '',
        location: initialData.location || '',
        commitment: initialData.commitment || '',
        category: initialData.category || '',
        requiredSkills: initialData.requiredSkills?.join(', ') || '',
        pointsAwarded: initialData.pointsAwarded ?? 0,
        applicationDeadline: initialData.applicationDeadline ? new Date(initialData.applicationDeadline) : undefined,
        eventStartDate: initialData.eventStartDate ? new Date(initialData.eventStartDate) : undefined,
        eventEndDate: initialData.eventEndDate ? new Date(initialData.eventEndDate) : undefined,
      });
      setCurrentImageUrl(initialData.imageUrl);
    }
  }, [mode, initialData, form]);


  async function onSubmit(values: OpportunityFormValues) {
    if (!user || role !== 'organization') {
      toast({ title: 'Unauthorized', description: 'Only organizations can manage opportunities.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    let finalImageUrl = currentImageUrl; // Use existing image by default
    const imageFile = values.image?.[0];

    if (imageFile) { // If a new image is uploaded
      try {
        finalImageUrl = await fileToDataUri(imageFile);
      } catch (error) {
        console.error('Error converting image file to Data URI:', error);
        toast({ title: 'Image Error', description: 'Could not process new image.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
    } else if (currentImageUrl === null) { // If current image was explicitly removed
        finalImageUrl = undefined;
    }

    const skillsArray = values.requiredSkills ? values.requiredSkills.split(',').map(s => s.trim()).filter(s => s) : [];

    const opportunityPayload = {
      ...values,
      requiredSkills: skillsArray,
      imageUrl: finalImageUrl, // Use the determined image URL
      pointsAwarded: values.pointsAwarded ?? 0,
      // Dates are already Date objects from the form
    };
    // Remove the 'image' FileList from the payload to be sent to the action
    const { image, ...payloadForAction } = opportunityPayload;


    try {
      let result;
      if (mode === 'create') {
        result = await createOpportunityAction(
          payloadForAction,
          user.id,
          user.displayName
        );
      } else if (mode === 'edit' && opportunityId) {
        result = await updateOpportunityAction(
          opportunityId,
          payloadForAction,
          user.id // Pass org ID for verification
        );
      } else {
        throw new Error("Invalid form mode or missing opportunity ID.");
      }

      if (result.success && result.opportunity) {
        toast({ title: 'Success', description: `Opportunity "${result.opportunity.title}" ${mode === 'create' ? 'created' : 'updated'}.` });
        form.reset();
        router.push('/dashboard/organization');
        router.refresh(); // To reflect changes on the dashboard
      } else {
        throw new Error(result.message || `Failed to ${mode} opportunity.`);
      }
    } catch (error: any) {
      console.error(`Opportunity ${mode} failed:`, error);
      toast({ title: 'Error', description: error.message || `Could not ${mode} opportunity.`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleRemoveCurrentImage = () => {
    setCurrentImageUrl(null); // Mark for removal or no image
    form.setValue('image', undefined, { shouldValidate: true }); // Clear any selected file
  };


  if (!user || role !== 'organization') {
     return <p className="text-destructive text-center">You must be logged in as an organization to manage opportunities.</p>;
  }
  
  if (mode === 'edit' && !initialData && !form.formState.isLoading) {
    return <p className="text-destructive text-center">Opportunity data could not be loaded for editing.</p>;
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
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {opportunityCategories.filter(cat => cat !== 'All').map((cat) => (
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
        
        {/* Required Skills */}
        <FormField
          control={form.control}
          name="requiredSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-muted-foreground" /> Required Skills (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g., Communication, Teamwork, Event Planning" 
                  className="resize-none bg-background" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormDescription>Enter skills separated by commas. Volunteers with matching skills may be suggested.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


         {/* Application Deadline (Optional) */}
         <FormField
           control={form.control}
           name="applicationDeadline"
           render={({ field }) => (
             <FormItem className="flex flex-col">
               <FormLabel>Application Deadline (Optional)</FormLabel>
               <Popover>
                 <PopoverTrigger asChild>
                   <FormControl>
                     <Button
                       variant={"outline"}
                       className={cn(
                         "w-full pl-3 text-left font-normal bg-background",
                         !field.value && "text-muted-foreground"
                       )}
                     >
                       {field.value ? (
                         format(field.value, "PPP")
                       ) : (
                         <span>Pick a date</span>
                       )}
                       <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                     </Button>
                   </FormControl>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={field.value}
                     onSelect={field.onChange}
                     disabled={(date) =>
                       mode === 'create' ? date < new Date(new Date().setDate(new Date().getDate() -1)) : false // Disable past dates only for create mode
                     }
                     initialFocus
                   />
                 </PopoverContent>
               </Popover>
               <FormDescription>
                 Last date for volunteers to apply for this opportunity.
               </FormDescription>
               <FormMessage />
             </FormItem>
           )}
         />

        {/* Event Start Date (Optional -> Required) */}
        <FormField
          control={form.control}
          name="eventStartDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Event Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-background",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a start date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When the event or activity starts.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event End Date (Optional -> Required) */}
        <FormField
          control={form.control}
          name="eventEndDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Event End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-background",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick an end date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      form.getValues("eventStartDate")
                        ? date < form.getValues("eventStartDate")!
                        : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When the event or activity ends.
              </FormDescription>
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
                 <Input type="number" placeholder="e.g., 50" {...field} className="bg-background" min="0" value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
               </FormControl>
               <FormDescription>Points awarded to volunteers upon completion/acceptance.</FormDescription>
               <FormMessage />
             </FormItem>
           )}
         />

        {/* Image Upload (Optional) */}
        {mode === 'edit' && currentImageUrl && (
          <div className="space-y-2">
            <FormLabel>Current Image</FormLabel>
            <div className="relative w-full h-48 rounded-md overflow-hidden border">
              <Image src={currentImageUrl} alt="Current opportunity image" layout="fill" objectFit="cover" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleRemoveCurrentImage} className="text-xs text-destructive">
              <Trash2 className="mr-1 h-3 w-3" /> Remove Current Image
            </Button>
            <FormDescription>To change the image, upload a new one below. Removing the current image without uploading a new one will clear it.</FormDescription>
          </div>
        )}
         <FormField
           control={form.control}
           name="image"
           render={({ field: { onChange, value, ...fieldProps } }) => {
             const currentFile = value?.[0];
             return (
               <FormItem>
                 <FormLabel>{mode === 'edit' && currentImageUrl ? 'Upload New Image (Optional)' : 'Opportunity Image (Optional)'}</FormLabel>
                 <FormControl>
                   <div className="relative">
                      <Input
                        {...fieldProps}
                        type="file"
                        accept="image/jpeg, image/png, image/webp, image/gif"
                        {...form.register("image")}
                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-background"
                      />
                      {currentFile && <span className="text-sm text-muted-foreground mt-1 block">New: {currentFile.name}</span>}
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                   </div>
                 </FormControl>
                 <FormDescription>Upload an image related to the opportunity (JPG, PNG, WEBP, GIF, max 2MB).</FormDescription>
                 <FormMessage />
               </FormItem>
             );
           }}
         />


        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Create Opportunity' : 'Update Opportunity'
          )}
        </Button>
      </form>
    </Form>
  );
}
