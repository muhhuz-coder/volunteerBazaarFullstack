
// src/actions/job-board-actions.ts
'use server';

import {
    getOpportunities as getOpportunitiesService,
    getApplicationsForOrganization as getOrgAppsService,
    getApplicationsForVolunteer as getVolunteerAppsService,
    createOpportunity as createOpportunityService, // Import the service
    getOpportunityById as getOpportunityByIdService
} from '@/services/job-board';
import type { Opportunity, VolunteerApplication } from '@/services/job-board';

/**
 * Server action to get volunteer opportunities.
 * Now includes location, commitment, and sort parameters.
 */
export async function getOpportunitiesAction(
    keywords?: string,
    category?: string,
    location?: string, // New parameter
    commitment?: string, // New parameter
    sort?: string // New parameter for sorting (e.g., 'recent', 'title_asc')
): Promise<Opportunity[]> {
    console.log('Server Action: Getting opportunities. Keywords:', keywords, 'Category:', category, 'Location:', location, 'Commitment:', commitment, 'Sort:', sort);
    try {
        // Pass new parameters to the service layer
        const opportunities = await getOpportunitiesService(keywords, category, location, commitment, sort);
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
    opportunityData: Omit<Opportunity, 'id'>,
    organizationId: string,
    organizationName: string
): Promise<{ success: boolean; message: string; opportunity?: Opportunity | null }> {
    console.log('Server Action: Creating opportunity for org:', organizationId);
    try {
        if (!opportunityData.title || !opportunityData.description || !opportunityData.location || !opportunityData.commitment || !opportunityData.category) {
            return { success: false, message: 'Missing required opportunity details.', opportunity: null };
        }
        if (opportunityData.imageUrl && !opportunityData.imageUrl.startsWith('data:image')) {
             return { success: false, message: 'Invalid image format provided.', opportunity: null };
        }

        const newOpportunity = await createOpportunityService({
            ...opportunityData,
            organizationId: organizationId,
            organization: organizationName
        });
        return { success: true, message: 'Opportunity created successfully.', opportunity: newOpportunity };
    } catch (error: any) {
        console.error("Server Action: Create opportunity error -", error);
        return { success: false, message: error.message || 'Failed to create opportunity.', opportunity: null };
    }
}
