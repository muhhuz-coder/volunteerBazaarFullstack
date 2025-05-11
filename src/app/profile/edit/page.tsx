
// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Save, UserCircle, FileText, ShieldQuestion, Sparkles } from 'lucide-react'; // Added icons for new fields
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Validation schema for profile details
const profileDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  bio: z.string().max(500, 'Bio can be at most 500 characters.').optional(),
  // Skills and causes will be strings from textarea, parsed later
  skills: z.string().optional(),
  causes: z.string().optional(),
});

type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>;

export default function EditProfilePage() {
  const { user, loading: authLoading, updateProfilePicture, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmittingPicture, setIsSubmittingPicture] = useState(false);
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

  const { control, handleSubmit: handleDetailsSubmit, reset: resetDetailsForm, formState: { errors: detailsErrors } } = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      skills: user?.skills?.join(', ') || '',
      causes: user?.causes?.join(', ') || '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      setPreviewUrl(user.profilePictureUrl || null);
      resetDetailsForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        causes: user.causes?.join(', ') || '',
      });
    }
  }, [user, authLoading, router, resetDetailsForm]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File Too Large", description: "Image size cannot exceed 2MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(user?.profilePictureUrl || null);
    }
  };

  const handlePictureSubmit = async () => {
    if (!selectedFile || !previewUrl || !user) {
      toast({ title: "No Image Selected", description: "Please select an image to upload." });
      return;
    }
    setIsSubmittingPicture(true);
    try {
      const result = await updateProfilePicture(previewUrl);
      if (result.success) {
        toast({ title: "Success", description: "Profile picture updated." });
        setSelectedFile(null);
      } else {
        toast({ title: "Update Failed", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmittingPicture(false);
    }
  };

  const onDetailsSubmit = async (data: ProfileDetailsFormValues) => {
    if (!user) return;
    setIsSubmittingDetails(true);
    try {
      const skillsArray = data.skills ? data.skills.split(',').map(s => s.trim()).filter(s => s) : [];
      const causesArray = data.causes ? data.causes.split(',').map(c => c.trim()).filter(c => c) : [];

      const result = await updateUserProfile({
        displayName: data.displayName,
        bio: data.bio,
        skills: skillsArray,
        causes: causesArray,
      });

      if (result.success) {
        toast({ title: "Success", description: "Profile details updated." });
      } else {
        toast({ title: "Update Failed", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1 && name.length > 0) return name[0].toUpperCase();
    if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
        return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.length > 0 ? name[0].toUpperCase() : '?';
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="w-full max-w-2xl mx-auto shadow-xl border">
          <CardHeader className="text-center pt-8 pb-4 border-b">
            <CardTitle className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
              <UserCircle className="h-8 w-8" />
              Edit Your Profile
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Keep your information up-to-date.</CardDescription>
          </CardHeader>

          <CardContent className="pt-8 px-6 md:px-8 space-y-10">
            {/* Profile Picture Section */}
            <div className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
              <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" /> Profile Picture
              </h3>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Profile Preview" className="object-cover" />
                  ) : (
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary font-semibold">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {selectedFile ? 'Change Picture' : 'Upload Picture'}
                </Button>
                {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
              </div>
              {selectedFile && (
                <Button
                  onClick={handlePictureSubmit}
                  disabled={isSubmittingPicture}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isSubmittingPicture ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile Picture
                </Button>
              )}
            </div>

            <Separator />

            {/* Profile Details Section */}
            <form onSubmit={handleDetailsSubmit(onDetailsSubmit)} className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
              <h3 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Personal Information
              </h3>
              
              {/* Display Name */}
              <div className="grid gap-1.5">
                <Label htmlFor="displayName" className="flex items-center gap-1.5"><UserCircle className="h-4 w-4 text-muted-foreground" /> Display Name</Label>
                <Controller
                  name="displayName"
                  control={control}
                  render={({ field }) => <Input id="displayName" placeholder="Your display name" {...field} className="bg-background" />}
                />
                {detailsErrors.displayName && <p className="text-sm text-destructive">{detailsErrors.displayName.message}</p>}
              </div>

              {/* Bio */}
              <div className="grid gap-1.5">
                <Label htmlFor="bio" className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-muted-foreground" /> Bio</Label>
                <Controller
                  name="bio"
                  control={control}
                  render={({ field }) => <Textarea id="bio" placeholder="Tell us a bit about yourself..." {...field} className="resize-none bg-background" rows={4} />}
                />
                {detailsErrors.bio && <p className="text-sm text-destructive">{detailsErrors.bio.message}</p>}
              </div>

              {/* Skills */}
              <div className="grid gap-1.5">
                <Label htmlFor="skills" className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-muted-foreground" /> Skills</Label>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => <Textarea id="skills" placeholder="e.g., Web Development, Writing, Event Planning" {...field} className="resize-none bg-background" rows={3} />}
                />
                <p className="text-xs text-muted-foreground">Enter skills separated by commas.</p>
                {detailsErrors.skills && <p className="text-sm text-destructive">{detailsErrors.skills.message}</p>}
                 {user?.skills && user.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                  </div>
                )}
              </div>

              {/* Causes */}
              <div className="grid gap-1.5">
                <Label htmlFor="causes" className="flex items-center gap-1.5"><ShieldQuestion className="h-4 w-4 text-muted-foreground" /> Causes You Care About</Label>
                <Controller
                  name="causes"
                  control={control}
                  render={({ field }) => <Textarea id="causes" placeholder="e.g., Environment, Education, Animal Welfare" {...field} className="resize-none bg-background" rows={3} />}
                />
                <p className="text-xs text-muted-foreground">Enter causes separated by commas.</p>
                {detailsErrors.causes && <p className="text-sm text-destructive">{detailsErrors.causes.message}</p>}
                {user?.causes && user.causes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.causes.map(cause => <Badge key={cause} variant="secondary">{cause}</Badge>)}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isSubmittingDetails} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmittingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile Details
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-6 border-t">
             <p className="text-xs text-muted-foreground text-center w-full">
                Make sure your profile accurately reflects your interests and skills to find the best opportunities.
             </p>
          </CardFooter>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}

