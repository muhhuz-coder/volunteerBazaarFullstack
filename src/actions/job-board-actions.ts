// src/actions/job-board-actions.ts
'use server';

import {
    getOpportunities as getOpportunitiesService,
    getApplicationsForOrganization as getOrgAppsService,
    getApplicationsForVolunteer as getVolunteerAppsService,
    createOpportunity as createOpportunityService, 
    getOpportunityById as getOpportunityByIdService,
    updateOpportunity as updateOpportunityService, // Import update service
    deleteOpportunity as deleteOpportunityService, // Import delete service
    getVolunteersForOpportunity as getVolunteersForOpportunityService
} from '@/services/job-board';
import type { Opportunity, VolunteerApplication } from '@/services/job-board';

/**
 * Server action to get volunteer opportunities.
 * Now includes location, commitment, sort, and tab parameters.
 */
export async function getOpportunitiesAction(
    keywords?: string,
    category?: string,
    location?: string, // New parameter
    commitment?: string, // New parameter
    sort?: string, // New parameter for sorting (e.g., 'recent', 'title_asc')
    tab?: 'all' | 'active' | 'archived' // New parameter for tabs
): Promise<Opportunity[]> {
    console.log('Server Action: Getting opportunities. Keywords:', keywords, 'Category:', category, 'Location:', location, 'Commitment:', commitment, 'Sort:', sort, 'Tab:', tab);
    try {
        // Pass new parameters to the service layer
        const opportunities = await getOpportunitiesService(keywords, category, location, commitment, sort, tab);
        return opportunities;
    } catch (error: any) {
        console.error("Server Action: Get opportunities error -", error);
        return []; // Return empty array on error
    }
}

/**
 * Server action to get applications for a specific organization.
 */
export async function getApplicationsForOrganizationAction(organizationId: string): Promise<VolunteerApplication[]> {
    console.log('Server Action: Getting applications for organization:', organizationId);
    try {
        const applications = await getOrgAppsService(organizationId);
        return applications;
    } catch (error: any) {
        console.error("Server Action: Get organization applications error -", error);
        return [];
    }
}

/**
 * Server action to get applications for a specific volunteer.
 */
export async function getApplicationsForVolunteerAction(volunteerId: string): Promise<VolunteerApplication[]> {
    console.log('Server Action: Getting applications for volunteer:', volunteerId);
    try {
        const applications = await getVolunteerAppsService(volunteerId);
        return applications;
    } catch (error: any) {
        console.error("Server Action: Get volunteer applications error -", error);
        return [];
    }
}

/**
 * Server action to get a single opportunity by ID.
 */
export async function getOpportunityByIdAction(id: string): Promise<Opportunity | undefined> {
     console.log('Server Action: Getting opportunity by ID:', id);
     try {
         const opportunity = await getOpportunityByIdService(id);
         return opportunity;
     } catch (error: any) {
         console.error("Server Action: Get opportunity by ID error -", error);
         return undefined;
     }
}

/**
 * Server action to create a new volunteer opportunity.
 */
export async function createOpportunityAction(
    opportunityData: Omit<Opportunity, 'id' | 'organizationId' | 'organization' | 'createdAt' | 'updatedAt'>,
    organizationId: string,
    organizationName: string
): Promise<{ success: boolean; message: string; opportunity?: Opportunity | null }> {
    console.log('Server Action: Creating opportunity for org:', organizationId);
    try {
        if (!opportunityData.title || !opportunityData.description || !opportunityData.location || !opportunityData.commitment || !opportunityData.category || !opportunityData.eventStartDate || !opportunityData.eventEndDate) {
            return { success: false, message: 'Missing required opportunity details including event dates.', opportunity: null };
        }
        if (opportunityData.imageUrl && !opportunityData.imageUrl.startsWith('data:image') && !opportunityData.imageUrl.startsWith('http')) {
             return { success: false, message: 'Invalid image format provided.', opportunity: null };
        }

        const newOpportunity = await createOpportunityService({
            ...opportunityData,
            organizationId: organizationId, 
            organization: organizationName,
            requiredSkills: opportunityData.requiredSkills || [], // Ensure requiredSkills is an array
            applicationDeadline: opportunityData.applicationDeadline ? new Date(opportunityData.applicationDeadline) : undefined,
            eventStartDate: new Date(opportunityData.eventStartDate), // Event dates are now required
            eventEndDate: new Date(opportunityData.eventEndDate),
        });
        return { success: true, message: 'Opportunity created successfully.', opportunity: newOpportunity };
    } catch (error: any) {
        console.error("Server Action: Create opportunity error -", error);
        return { success: false, message: error.message || 'Failed to create opportunity.', opportunity: null };
    }
}

/**
 * Server action to update an existing volunteer opportunity.
 */
export async function updateOpportunityAction(
    opportunityId: string,
    opportunityData: Partial<Omit<Opportunity, 'id' | 'organizationId' | 'organization' | 'createdAt' | 'updatedAt'>>,
    organizationId: string // For verification, though service layer might not strictly need it if ID is globally unique
): Promise<{ success: boolean; message: string; opportunity?: Opportunity | null }> {
    console.log(`Server Action: Updating opportunity ${opportunityId} for org: ${organizationId}`);
    try {
        // Basic validation
        if (opportunityData.imageUrl && !opportunityData.imageUrl.startsWith('data:image') && !opportunityData.imageUrl.startsWith('http')) {
            return { success: false, message: 'Invalid image format provided.', opportunity: null };
        }
         if (opportunityData.eventStartDate && !opportunityData.eventEndDate && !getOpportunityByIdService(opportunityId)?.eventEndDate) {
             return { success: false, message: 'Event end date is required if start date is provided.', opportunity: null };
         }
         if (!opportunityData.eventStartDate && opportunityData.eventEndDate && !getOpportunityByIdService(opportunityId)?.eventStartDate) {
             return { success: false, message: 'Event start date is required if end date is provided.', opportunity: null };
         }


        const updatedOpportunity = await updateOpportunityService(opportunityId, {
            ...opportunityData,
            requiredSkills: opportunityData.requiredSkills || [], // Ensure requiredSkills is an array if provided
            // Dates will be handled by the service if they exist in opportunityData
        });
        
        if (!updatedOpportunity) {
            return { success: false, message: 'Opportunity not found or update failed.', opportunity: null };
        }
        return { success: true, message: 'Opportunity updated successfully.', opportunity: updatedOpportunity };
    } catch (error: any) {
        console.error("Server Action: Update opportunity error -", error);
        return { success: false, message: error.message || 'Failed to update opportunity.', opportunity: null };
    }
}

/**
 * Server action to delete a volunteer opportunity.
 */
export async function deleteOpportunityAction(
    opportunityId: string,
    organizationId: string // To verify ownership before deletion
): Promise<{ success: boolean; message: string; notifiedCount?: number }> {
    console.log(`Server Action: Deleting opportunity ${opportunityId} for org: ${organizationId}`);
    try {
        // The service will handle finding the opportunity and notifying applicants
        const result = await deleteOpportunityService(opportunityId, organizationId);
        return result; // { success, message, notifiedCount }
    } catch (error: any) {
        console.error("Server Action: Delete opportunity error -", error);
        return { success: false, message: error.message || 'Failed to delete opportunity.' };
    }
}

/**
 * Server action to get all volunteers who have applied to a specific opportunity
 */
export async function getVolunteersForOpportunityAction(opportunityId: string): Promise<{
  success: boolean;
  volunteers?: {application: any; volunteer: any}[];
  message?: string;
}> {
  console.log(`Server Action: Getting volunteers for opportunity ${opportunityId}`);
  try {
    const volunteers = await getVolunteersForOpportunityService(opportunityId);
    return { success: true, volunteers };
  } catch (error: any) {
    console.error("Server Action: Get volunteers error -", error);
    return { success: false, message: error.message || 'Failed to get volunteers for this opportunity.' };
  }
}
