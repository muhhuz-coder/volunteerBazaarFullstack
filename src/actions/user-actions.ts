// src/actions/user-actions.ts
'use server';

import { getPublicVolunteers as getPublicVolunteersService } from '@/services/user-service';
import type { UserProfile } from '@/context/AuthContext';

interface GetVolunteersFilters {
    keywords?: string;
    sortBy?: string;
}

/**
 * Server action to get public volunteer profiles.
 * Calls the service function to retrieve and filter volunteers.
 */
export async function getPublicVolunteersAction(filters?: GetVolunteersFilters): Promise<UserProfile[]> {
    console.log('Server Action: Getting public volunteer profiles with filters:', filters);
    try {
        const volunteers = await getPublicVolunteersService(filters);
        return volunteers;
    } catch (error: any) {
        console.error("Server Action: Get public volunteers error -", error);
        return []; // Return empty array on error
    }
}
