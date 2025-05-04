
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
 */
export async function getOpportunitiesAction(keywords?: string, category?: string): Promise<Opportunity[]> {
    console.log('Server Action: Getting opportunities. Keywords:', keywords, 'Category:', category);
    try {
        const opportunities = await getOpportunitiesService(keywords, category);
        // Ensure dates or complex objects are serializable if needed (they are simple here)
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
        // Ensure dates are serializable (convert to string or keep as Date if supported)
        // Service layer already ensures they are Date objects, which Next.js handles
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
        // Ensure dates are serializable
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
        // Add validation logic here if needed (e.g., check if fields are empty)
        if (!opportunityData.title || !opportunityData.description || !opportunityData.location || !opportunityData.commitment || !opportunityData.category) {
            return { success: false, message: 'Missing required opportunity details.', opportunity: null };
        }

        const newOpportunity = await createOpportunityService({
            ...opportunityData,
            organizationId: organizationId, // Ensure the correct org ID is set
            organization: organizationName // Ensure the correct org name is set
        });
        return { success: true, message: 'Opportunity created successfully.', opportunity: newOpportunity };
    } catch (error: any) {
        console.error("Server Action: Create opportunity error -", error);
        return { success: false, message: error.message || 'Failed to create opportunity.', opportunity: null };
    }
}
