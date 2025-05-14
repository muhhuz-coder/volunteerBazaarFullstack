// src/actions/application-actions.ts
'use server';

import {
    submitVolunteerApplication as submitAppService,
    updateApplicationStatus as updateAppStatusService,
    getOpportunityById, // Needed to award correct points
    recordVolunteerPerformance // Import new service function
} from '@/services/job-board';
import { createConversation as createConversationService } from '@/services/messaging';
import { createNotification } from '@/services/notification'; // Import notification service
import type { VolunteerApplication, Opportunity } from '@/services/job-board';
import type { Conversation } from '@/services/messaging'; // Import Conversation type
import { addPointsAction, logHoursAction } from './gamification-actions'; // Import gamification actions


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
            attendance: 'pending', // Default attendance
            submittedAt: new Date(), // Add submittedAt field
        });

        // Note: Points are awarded in the AuthContext after this action succeeds

        return { success: true, message: "Application submitted successfully!" };
    } catch (error: any) {
        console.error("Server Action: Submit application error -", error);
        
        // Check if this is a duplicate application error
        if (error.message && error.message.includes("already applied")) {
            return { success: false, message: "You have already applied to this opportunity." };
        }
        
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

        // 3. Award points for acceptance (if different from completion points)
        // Let's assume pointsAwarded on opportunity is for completion.
        // We can define separate acceptance points if needed, e.g., 10 points.
        await addPointsAction(volunteerId, 10, `Application accepted for: ${updatedApp.opportunityTitle}`);


        // 4. Create Notification for the volunteer
        const notificationMessage = `Your application for "${updatedApp.opportunityTitle}" has been accepted!`;
        const notificationLink = `/dashboard/messages/${conversation.id}`; // Link to the new conversation
        await createNotification(volunteerId, notificationMessage, notificationLink);

        return { success: true, message: 'Application accepted, conversation started, and notification sent.', conversationId: conversation.id, updatedApp: updatedApp };
    } catch (error: any) {
        console.error("Server Action: Accept application error -", error);
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


/**
 * Server action for an organization to record a volunteer's performance for an application/activity.
 * Updates the application with attendance, rating, and hours.
 * If attended, awards points and logs hours for the volunteer.
 */
export async function recordVolunteerPerformanceAction(
  applicationId: string,
  performanceData: {
    attendance: 'present' | 'absent' | 'pending';
    orgRating?: number; // 1-5
    hoursLoggedByOrg?: number;
  }
): Promise<{ success: boolean; message: string; updatedApplication?: VolunteerApplication | null }> {
  console.log(`Server Action: Recording performance for application ${applicationId}`, performanceData);
  try {
    // Step 1: Update the application with performance data
    const updatedApp = await recordVolunteerPerformance(applicationId, performanceData);

    if (!updatedApp) {
      return { success: false, message: "Failed to update application with performance data.", updatedApplication: null };
    }

    // Step 2: If volunteer was present, trigger gamification
    if (performanceData.attendance === 'present') {
      const opportunity = await getOpportunityById(updatedApp.opportunityId);
      if (!opportunity) {
        console.warn(`Server Action: Opportunity ${updatedApp.opportunityId} not found for gamification updates.`);
        // Proceed without opportunity-specific points if not found, but log hours.
      }

      // Award points for completing the opportunity
      const completionPoints = opportunity?.pointsAwarded || 0; // Default to 0 if not defined
      if (completionPoints > 0) {
        await addPointsAction(updatedApp.volunteerId, completionPoints, `Completed: ${updatedApp.opportunityTitle}`);
      }

      // Award bonus points for high rating
      if (performanceData.orgRating && performanceData.orgRating >= 4) {
        const ratingBonusPoints = performanceData.orgRating === 5 ? 20 : 10; // Example: 20 for 5-star, 10 for 4-star
        await addPointsAction(updatedApp.volunteerId, ratingBonusPoints, `Received ${performanceData.orgRating}-star rating for: ${updatedApp.opportunityTitle}`);
      }

      // Log hours
      if (performanceData.hoursLoggedByOrg && performanceData.hoursLoggedByOrg > 0) {
        await logHoursAction(updatedApp.volunteerId, performanceData.hoursLoggedByOrg, `Volunteered for: ${updatedApp.opportunityTitle}`);
      }

       // Create Notification for the volunteer
       const notificationMessage = `Your participation for "${updatedApp.opportunityTitle}" has been recorded. Thank you!`;
       const notificationLink = `/dashboard/volunteer`; // Link to their dashboard
       await createNotification(updatedApp.volunteerId, notificationMessage, notificationLink);
    }

    return { success: true, message: "Volunteer performance recorded successfully.", updatedApplication: updatedApp };

  } catch (error: any) {
    console.error("Server Action: Record volunteer performance error -", error);
    return { success: false, message: error.message || 'Failed to record volunteer performance.', updatedApplication: null };
  }
}
