// src/components/report-user-dialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // For other potential fields
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/context/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ReportUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: UserProfile;
  onSubmit: (reason: string, details?: string) => Promise<boolean>; // Returns true on success
  isSubmitting: boolean;
}

const reportReasons = [
  "Inappropriate Content/Behavior",
  "Spam or Scam",
  "Harassment",
  "Misleading Information",
  "Impersonation",
  "Other",
];

export function ReportUserDialog({
  isOpen,
  onClose,
  reportedUser,
  onSubmit,
  isSubmitting,
}: ReportUserDialogProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [details, setDetails] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) {
      toast({ title: "Reason Required", description: "Please select or provide a reason for the report.", variant: "destructive" });
      return;
    }
    const success = await onSubmit(finalReason, details.trim() || undefined);
    if (success) {
      setReason('');
      setCustomReason('');
      setDetails('');
      // onClose(); // Parent will handle closing via isOpen prop change after successful submission
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-destructive" /> Report {reportedUser.displayName}
            </DialogTitle>
            <DialogDescription>
              Please provide details about why you are reporting this user. Your report will be reviewed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="reason-select">Reason for Report</Label>
              <select
                id="reason-select"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value !== 'Other') setCustomReason('');
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring/70 focus:border-primary"
                required
              >
                <option value="" disabled>Select a reason</option>
                {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {reason === 'Other' && (
              <div className="grid gap-2">
                <Label htmlFor="custom-reason">Specify Other Reason</Label>
                <Input
                  id="custom-reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please specify"
                  required={reason === 'Other'}
                  className="bg-background"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any specific details, links, or context..."
                className="resize-none bg-background"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !reason || (reason === 'Other' && !customReason.trim())} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
