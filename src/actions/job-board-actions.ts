
// src/actions/job-board-actions.ts
'use server';

import {
    getOpportunities as getOpportunitiesService,
    getApplicationsForOrganization as getOrgAppsService,
    getApplicationsForVolunteer as getVolunteerAppsService,
    createOpportunity as createOpportunityService, // If needed later
    getOpportunityById as getOpportunityByIdService // If needed later
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

// Example for creating an opportunity (add if needed)
/*
export async function createOpportunityAction(opportunityData: Omit<Opportunity, 'id'>): Promise<Opportunity | { error: string }> {
    console.log('Server Action: Creating opportunity');
    try {
        // Add validation logic here if needed
        const newOpportunity = await createOpportunityService(opportunityData);
        return newOpportunity;
    } catch (error: any) {
        console.error("Server Action: Create opportunity error -", error);
        return { error: error.message || 'Failed to create opportunity.' };
    }
}
*/

