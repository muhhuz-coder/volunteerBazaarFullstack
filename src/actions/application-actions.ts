
// src/actions/application-actions.ts
'use server';

import {
    submitVolunteerApplication as submitAppService,
    updateApplicationStatus as updateAppStatusService,
    getOpportunityById // Needed to award correct points
} from '@/services/job-board';
import { createConversation as createConversationService } from '@/services/messaging';
import { createNotification } from '@/services/notification'; // Import notification service
import type { VolunteerApplication, Opportunity } from '@/services/job-board';
import type { Conversation } from '@/services/messaging'; // Import Conversation type
import { addPointsAction } from './gamification-actions'; // Import gamification action


/**
 * Server action to submit a volunteer application.
 * Calls the service function to persist the application.
 */
export async function submitVolunteerApplicationAction(
    applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'>,
    volunteerId: string,
    applicantName: string // Pass applicant name for consistency
): Promise<{ success: boolean; message: string }> {
    console.log('Server Action: Submitting application for opportunity:', applicationData.opportunityId, 'by volunteer:', volunteerId);
    try {
        const message = await submitAppService({
            ...applicationData,
            volunteerId: volunteerId,
            applicantName: applicantName, // Ensure name from context is used
            status: 'submitted', // Explicitly set status
        });

        // Note: Points are awarded in the AuthContext after this action succeeds

        return { success: true, message: message };
    } catch (error: any) {
        console.error("Server Action: Submit application error -", error);
        return { success: false, message: error.message || 'Failed to submit application.' };
    }
}


/**
 * Server action to accept a volunteer application.
 * Updates application status, creates a conversation, potentially awards points, and creates a notification.
 */
export async function acceptVolunteerApplication(
    applicationId: string,
    volunteerId: string,
    organizationId: string,
    organizationName: string
): Promise<{ success: boolean; message: string; conversationId?: string, updatedApp?: VolunteerApplication | null }> {
    console.log('Server Action: Accepting application:', applicationId, 'for volunteer:', volunteerId, 'by org:', organizationId);
    try {
        // 1. Update application status
        const updatedApp = await updateAppStatusService(applicationId, 'accepted');

        // 2. Create conversation
        const conversation = await createConversationService({
           organizationId: organizationId,
           volunteerId: volunteerId,
           opportunityId: updatedApp.opportunityId,
           opportunityTitle: updatedApp.opportunityTitle,
           organizationName: organizationName,
           volunteerName: updatedApp.applicantName,
           initialMessage: `Congratulations! Your application for "${updatedApp.opportunityTitle}" has been accepted. Let's coordinate next steps.`,
        });

        // 3. Award points (call the action directly)
        let pointsToAward = 50; // Default acceptance points
        try {
            const opportunity = await getOpportunityById(updatedApp.opportunityId);
            if (opportunity && opportunity.pointsAwarded) {
                pointsToAward = opportunity.pointsAwarded;
            }
        } catch (e) {
            console.warn("Could not fetch opportunity details for points, using default.")
        }
        await addPointsAction(volunteerId, pointsToAward, `Accepted for opportunity: ${updatedApp.opportunityTitle}`);

        // 4. Create Notification for the volunteer
        const notificationMessage = `Your application for "${updatedApp.opportunityTitle}" has been accepted!`;
        const notificationLink = `/dashboard/messages/${conversation.id}`; // Link to the new conversation
        await createNotification(volunteerId, notificationMessage, notificationLink);

        return { success: true, message: 'Application accepted, conversation started, and notification sent.', conversationId: conversation.id, updatedApp: updatedApp };
    } catch (error: any) {
        console.error("Server Action: Accept application error -", error);
        // Consider rolling back status update if conversation/notification creation fails? (More complex)
        return { success: false, message: error.message || 'Failed to accept application.', updatedApp: null };
    }
}

/**
 * Server action to reject a volunteer application.
 * Updates application status and creates a notification.
 */
export async function rejectVolunteerApplication(
    applicationId: string
): Promise<{ success: boolean; message: string; updatedApp?: VolunteerApplication | null }> {
     console.log('Server Action: Rejecting application:', applicationId);
     try {
        // Update application status via service
        const updatedApp = await updateAppStatusService(applicationId, 'rejected');

        // Create Notification for the volunteer
        const notificationMessage = `Unfortunately, your application for "${updatedApp.opportunityTitle}" was not accepted at this time.`;
        // No specific link for rejection, maybe link to their dashboard?
        const notificationLink = `/dashboard/volunteer`;
        await createNotification(updatedApp.volunteerId, notificationMessage, notificationLink);

        return { success: true, message: 'Application rejected and notification sent.', updatedApp: updatedApp };
     } catch (error: any) {
        console.error("Server Action: Reject application error -", error);
        return { success: false, message: error.message || 'Failed to reject application.', updatedApp: null };
     }
}
