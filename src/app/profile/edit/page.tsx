
// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Upload, Save, Camera } from 'lucide-react';

// Helper function to convert File to Base64 Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function EditProfilePage() {
  const { user, loading: authLoading, updateProfilePicture } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if not logged in after loading check
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Set initial preview if user has a picture
    if (user?.profilePictureUrl) {
      setPreviewUrl(user.profilePictureUrl);
    }
  }, [user, authLoading, router]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (consider more robust checks)
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File Too Large", description: "Image size cannot exceed 2MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(user?.profilePictureUrl || null); // Revert to original if selection is cleared
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !previewUrl) {
      toast({ title: "No Image Selected", description: "Please select an image to upload." });
      return;
    }
    if (!user) {
        toast({ title: "Error", description: "User not found.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      // The previewUrl is already the Data URI
      const result = await updateProfilePicture(previewUrl);
      if (result.success) {
        toast({ title: "Success", description: "Profile picture updated." });
        setSelectedFile(null); // Clear selection after successful upload
        // Preview URL is already updated via user state change in context
      } else {
        toast({ title: "Update Failed", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Profile picture update failed:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Should have been redirected, but good to handle
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="w-full max-w-xl mx-auto shadow-xl border">
          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-3xl font-bold text-primary mb-2">Edit Profile</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Update your profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 md:px-8 pb-10">
            {/* Profile Picture Section */}
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
               {/* Hidden file input */}
               <Input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleFileChange}
                 className="hidden"
                 id="profile-picture-upload"
               />
               {/* Custom Button to trigger file input */}
               <Button
                 variant="outline"
                 onClick={() => fileInputRef.current?.click()}
                 className="gap-2"
               >
                 <Camera className="h-4 w-4" />
                 {previewUrl && previewUrl !== user.profilePictureUrl ? 'Change Picture' : 'Upload Picture'}
               </Button>
                {selectedFile && (
                    <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                )}
            </div>

            {/* Save Button - Enabled only if a new file is selected */}
            {selectedFile && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Profile Picture
                  </>
                )}
              </Button>
            )}

            {/* Placeholder for other profile fields */}
            {/*
            <Separator />
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={user.displayName} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="mt-1 bg-muted" />
            </div>
            */}
          </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
