'use server';
// src/services/job-board.ts
import { 
  getOpportunities as dbGetOpportunities,
  getOpportunityById as dbGetOpportunityById,
  createOpportunity as dbCreateOpportunity,
  updateOpportunity as dbUpdateOpportunity,
  deleteOpportunity as dbDeleteOpportunity,
  getApplicationsForOrganization as dbGetApplicationsForOrganization,
  getApplicationsForVolunteer as dbGetApplicationsForVolunteer,
  submitVolunteerApplication as dbSubmitVolunteerApplication,
  updateApplicationStatus as dbUpdateApplicationStatus,
  recordVolunteerPerformance as dbRecordVolunteerPerformance,
  getVolunteersForOpportunity as dbGetVolunteersForOpportunity
} from '@/lib/db-mysql';
import { createNotification } from '@/services/notification'; // Import notification service
import type { UserProfile } from '@/context/AuthContext';

/**
 * Represents a volunteer opportunity posting.
 */
export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  organizationId: string;
  description: string;
  location: string;
  commitment: string;
  category: string;
  requiredSkills?: string[]; // New: Skills required for the opportunity
  pointsAwarded?: number; // Optional points awarded upon completion/acceptance
  imageUrl?: string; // Optional image for the opportunity (Data URI or URL)
  createdAt?: Date | string; // Optional: Timestamp for when opportunity was created for sorting
  applicationDeadline?: Date | string; // Optional: Deadline for applications
  eventStartDate?: Date | string; // New: Start date of the event/activity
  eventEndDate?: Date | string; // New: End date of the event/activity
  updatedAt?: Date | string; // Timestamp for last update
}

/**
 * Represents a volunteer application/interest registration.
 */
export interface VolunteerApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  volunteerId: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string; // Stores Data URI of attachment
  coverLetter: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn' | 'completed'; // Added 'completed' status
  submittedAt: Date | string; // Allow string during read, convert to Date
  attendance?: 'present' | 'absent' | 'pending'; // New field for attendance
  orgRating?: number; // New field for rating given by organization (e.g., 1-5)
  hoursLoggedByOrg?: number; // New field for hours logged by organization
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Asynchronously retrieves volunteer opportunities based on search keywords and categories.
 * Reads from the loaded data and simulates filtering.
 * @param keywords Keywords to search for in opportunity titles or descriptions.
 * @param category Category to filter opportunities.
 * @param location Location to filter opportunities.
 * @param commitment Commitment type to filter opportunities.
 * @param sort Sorting criteria.
 * @param tab Tab filter for opportunity status (all, active, archived).
 * @returns A promise that resolves to an array of Opportunity objects.
 */
export async function getOpportunities(
    keywords?: string,
    category?: string,
    location?: string,
    commitment?: string,
    sort: string = 'recent', // Default sort by recent
    tab: 'all' | 'active' | 'archived' = 'all' // New parameter for tabs
): Promise<Opportunity[]> {
  console.log(`Fetching opportunities with keywords: "${keywords}", category: "${category}", location: "${location}", commitment: "${commitment}", sort: "${sort}", tab: "${tab}"`);
  await sleep(100); 
  
  // Get opportunities from MySQL database
  let opportunitiesData = await dbGetOpportunities(keywords, category, location, commitment);

  // Apply tab-based filtering based on createdAt
  // For "active" tab, now also consider if applicationDeadline exists and hasn't passed
  if (tab === 'active') {
    const now = new Date();
    opportunitiesData = opportunitiesData.filter(opp => {
        const createdAtDate = opp.createdAt instanceof Date ? opp.createdAt : new Date(opp.createdAt || 0);
        const deadline = opp.applicationDeadline ? (opp.applicationDeadline instanceof Date ? opp.applicationDeadline : new Date(opp.applicationDeadline)) : null;
        
        const isRecent = createdAtDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Created in last 30 days
        const isDeadlineOpen = deadline ? deadline >= now : true; // If deadline exists, it must not have passed

        return isRecent && isDeadlineOpen;
    });
  } else if (tab === 'archived') {
    const now = new Date();
    opportunitiesData = opportunitiesData.filter(opp => {
      const createdAtDate = opp.createdAt instanceof Date ? opp.createdAt : new Date(opp.createdAt || 0);
      const deadline = opp.applicationDeadline ? (opp.applicationDeadline instanceof Date ? opp.applicationDeadline : new Date(opp.applicationDeadline)) : null;
      
      const isOld = createdAtDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Older than 30 days
      const isDeadlinePassed = deadline ? deadline < now : false; // If deadline exists, it has passed

      return isOld || isDeadlinePassed; // Archived if old OR deadline passed
    });
  }

  // Sorting logic
  switch (sort) {
    case 'title_asc':
      opportunitiesData.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title_desc':
      opportunitiesData.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'deadline_asc': // New sort option
      opportunitiesData.sort((a, b) => {
        const deadlineA = a.applicationDeadline ? (a.applicationDeadline instanceof Date ? a.applicationDeadline : new Date(a.applicationDeadline)).getTime() : Infinity;
        const deadlineB = b.applicationDeadline ? (b.applicationDeadline instanceof Date ? b.applicationDeadline : new Date(b.applicationDeadline)).getTime() : Infinity;
        return deadlineA - deadlineB;
      });
      break;
    case 'recent': // Default sort by createdAt descending (newest first)
    default:
      opportunitiesData.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt || 0);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      break;
  }

  console.log(`Returning ${opportunitiesData.length} opportunities after tab and sort.`);
  return [...opportunitiesData]; // Return a copy
}

/**
 * Asynchronously retrieves applications for a specific organization.
 * @param organizationId The ID of the organization.
 * @returns A promise that resolves to an array of VolunteerApplication objects for that org.
 */
export async function getApplicationsForOrganization(organizationId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for organization ID: ${organizationId}`);
    await sleep(100);
    
    // Use the MySQL database function
    return await dbGetApplicationsForOrganization(organizationId);
}

/**
 * Asynchronously retrieves applications for a specific volunteer.
 * @param volunteerId The ID of the volunteer.
 * @returns A promise that resolves to an array of VolunteerApplication objects for that volunteer.
 */
export async function getApplicationsForVolunteer(volunteerId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for volunteer ID: ${volunteerId}`);
    await sleep(100);
    
    // Use the MySQL database function
    return await dbGetApplicationsForVolunteer(volunteerId);
}

/**
 * Submits a volunteer application.
 * @param application The application details without an ID.
 * @returns A promise that resolves to the ID of the new application.
 */
export async function submitVolunteerApplication(application: Omit<VolunteerApplication, 'id'>): Promise<string> {
    console.log('Submitting volunteer application:', application);
    await sleep(100);
    
    // Use the MySQL database function
    return await dbSubmitVolunteerApplication(application);
}

/**
 * Updates the status of an application.
 * @param applicationId The ID of the application to update.
 * @param status The new status ('accepted' or 'rejected').
 * @returns A promise that resolves to the updated application.
 */
export async function updateApplicationStatus(
    applicationId: string,
    status: 'accepted' | 'rejected'
): Promise<VolunteerApplication> {
    console.log(`Updating application ${applicationId} to status: ${status}`);
    await sleep(100);
    
    // Use the MySQL database function
    return await dbUpdateApplicationStatus(applicationId, status);
}

/**
 * Creates a new volunteer opportunity.
 * @param opportunityData Data for the new opportunity (without ID).
 * @returns The newly created opportunity.
 */
export async function createOpportunity(opportunityData: Omit<Opportunity, 'id'>): Promise<Opportunity> {
    await sleep(300);
    console.log('Creating new opportunity:', opportunityData);
    
    // Use the MySQL database function to create the opportunity
    return await dbCreateOpportunity(opportunityData);
}

/**
 * Gets a single opportunity by ID.
 * @param id The ID of the opportunity.
 * @returns The opportunity or undefined if not found.
 */
export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
    await sleep(50);
    console.log(`Getting opportunity by ID: ${id}`);
    
    // Use the MySQL database function to get the opportunity
    const opportunity = await dbGetOpportunityById(id);
    return opportunity || undefined;
}

/**
 * Updates an existing volunteer opportunity.
 * @param opportunityId The ID of the opportunity to update.
 * @param opportunityData The partial data to update the opportunity with.
 * @returns The updated opportunity or null if not found.
 */
export async function updateOpportunity(
  opportunityId: string,
  opportunityData: Partial<Omit<Opportunity, 'id' | 'createdAt' | 'organizationId' | 'organization'>>
): Promise<Opportunity | null> {
  await sleep(300);
  console.log(`Updating opportunity: ${opportunityId}`, opportunityData);
  
  // Use the MySQL database function to update the opportunity
  return await dbUpdateOpportunity(opportunityId, opportunityData);
}

/**
 * Deletes a volunteer opportunity.
 * Also notifies volunteers who applied to this opportunity.
 * @param opportunityId The ID of the opportunity to delete.
 * @param organizationId The organization ID for verification.
 * @returns An object indicating success/failure and the count of notified volunteers.
 */
export async function deleteOpportunity(
  opportunityId: string,
  organizationId: string
): Promise<{ success: boolean; message: string; notifiedCount: number }> {
  await sleep(500);
  console.log(`Deleting opportunity: ${opportunityId} for org: ${organizationId}`);
  
  try {
    // Get the opportunity to verify ownership and for use in notifications
    const opportunityToDelete = await getOpportunityById(opportunityId);
    
    if (!opportunityToDelete) {
      return { success: false, message: 'Opportunity not found.', notifiedCount: 0 };
    }
    
    if (opportunityToDelete.organizationId !== organizationId) {
      return { success: false, message: 'Not authorized to delete this opportunity.', notifiedCount: 0 };
    }
    
    // Get applications for this opportunity to notify volunteers
    const applicationsData: VolunteerApplication[] = []; // This would come from a database query
    let notifiedCount = 0;
    
    // Notify all volunteers who applied
    for (const app of applicationsData) {
      try {
        await createNotification(
          app.volunteerId,
          `The opportunity "${opportunityToDelete.title}" you applied for has been cancelled by the organization.`,
          '/dashboard/volunteer' // Link to their dashboard
        );
        notifiedCount++;
      } catch (error) {
        console.error(`Failed to notify volunteer ${app.volunteerId} for deleted opportunity ${opportunityId}:`, error);
      }
    }
    
    // Use the MySQL database function to delete the opportunity
    const deleted = await dbDeleteOpportunity(opportunityId);
    
    if (deleted) {
      return { 
        success: true, 
        message: `Opportunity deleted successfully. ${notifiedCount} applicant(s) were notified.`, 
        notifiedCount 
      };
    } else {
      return { success: false, message: 'Failed to delete opportunity.', notifiedCount };
    }
    
  } catch (error: any) {
    console.error(`Error deleting opportunity ${opportunityId}:`, error);
    return { success: false, message: error.message || 'Error deleting opportunity.', notifiedCount: 0 };
  }
}

/**
 * Records feedback on volunteer performance after the opportunity.
 * @param applicationId The ID of the application to update.
 * @param feedbackData Object containing attendance, rating, and hours logged.
 * @returns A promise that resolves to the updated application.
 */
export async function recordVolunteerPerformance(
  applicationId: string,
  feedbackData: {
    attendance: 'present' | 'absent' | 'pending';
    orgRating?: number;
    hoursLoggedByOrg?: number;
  }
): Promise<VolunteerApplication> {
  console.log(`Recording performance for application ${applicationId}:`, feedbackData);
  await sleep(100);
  
  // Use the MySQL database function
  return await dbRecordVolunteerPerformance(applicationId, feedbackData);
}

/**
 * Gets all volunteers who have applied to a specific opportunity.
 * @param opportunityId The ID of the opportunity.
 * @returns A promise that resolves to an array of objects containing volunteer profiles and their application data.
 */
export async function getVolunteersForOpportunity(opportunityId: string): Promise<{application: VolunteerApplication; volunteer: UserProfile}[]> {
  console.log(`Getting volunteers for opportunity ${opportunityId}`);
  await sleep(100);
  
  // Use the MySQL database function
  return await dbGetVolunteersForOpportunity(opportunityId);
}
