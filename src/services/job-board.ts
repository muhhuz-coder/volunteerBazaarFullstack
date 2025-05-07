
'use server';
// src/services/job-board.ts
import { readData, writeData } from '@/lib/db-utils';

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
  pointsAwarded?: number; // Optional points awarded upon completion/acceptance
  imageUrl?: string; // Optional image for the opportunity (Data URI or URL)
  createdAt?: Date | string; // Optional: Timestamp for when opportunity was created for sorting
  applicationDeadline?: Date | string; // Optional: Deadline for applications
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

// File names for JSON data
const OPPORTUNITIES_FILE = 'opportunities.json';
const APPLICATIONS_FILE = 'applications.json';

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Data Loading ---
// Load data dynamically within functions to ensure server-side execution context

async function loadOpportunitiesData(): Promise<Opportunity[]> {
    const opportunities = await readData<Opportunity[]>(OPPORTUNITIES_FILE, []);
    return opportunities.map(opp => ({
        ...opp,
        createdAt: opp.createdAt ? new Date(opp.createdAt) : new Date(0), // Default to epoch if not present
        applicationDeadline: opp.applicationDeadline ? new Date(opp.applicationDeadline) : undefined,
    }));
}

async function loadApplicationsData(): Promise<VolunteerApplication[]> {
    const rawApplications = await readData<VolunteerApplication[]>(APPLICATIONS_FILE, []);
    return rawApplications.map(app => ({
        ...app,
        submittedAt: typeof app.submittedAt === 'string' ? new Date(app.submittedAt) : app.submittedAt,
        // Ensure new optional fields are handled if they exist
        attendance: app.attendance || 'pending',
    }));
}


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
  let opportunitiesData = await loadOpportunitiesData();

  if (keywords) {
    const lowerKeywords = keywords.toLowerCase();
    opportunitiesData = opportunitiesData.filter(opp =>
      opp.title.toLowerCase().includes(lowerKeywords) ||
      opp.organization.toLowerCase().includes(lowerKeywords) ||
      opp.description.toLowerCase().includes(lowerKeywords)
    );
  }

  if (category && category !== 'All') {
     opportunitiesData = opportunitiesData.filter(opp => opp.category === category);
  }

  if (location) {
    const lowerLocation = location.toLowerCase();
    // Simple string inclusion for location. Could be more advanced (e.g., specific city/province match).
    opportunitiesData = opportunitiesData.filter(opp => opp.location.toLowerCase().includes(lowerLocation));
  }

  if (commitment && commitment !== 'All') {
    // Simple string inclusion for commitment.
    opportunitiesData = opportunitiesData.filter(opp => opp.commitment.toLowerCase().includes(commitment.toLowerCase()));
  }

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
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
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
    const opportunitiesData = await loadOpportunitiesData();
    const applicationsData = await loadApplicationsData();

    const orgOpportunityIds = opportunitiesData
        .filter(opp => opp.organizationId === organizationId)
        .map(opp => opp.id);

    const applications = applicationsData.filter(app => orgOpportunityIds.includes(app.opportunityId));

    console.log(`Returning ${applications.length} applications for organization ${organizationId}.`);
    return applications.map(app => ({
        ...app,
        submittedAt: app.submittedAt instanceof Date ? app.submittedAt : new Date(app.submittedAt)
    }));
}

/**
 * Asynchronously retrieves applications submitted by a specific volunteer.
 * @param volunteerId The ID of the volunteer.
 * @returns A promise that resolves to an array of VolunteerApplication objects submitted by that volunteer.
 */
export async function getApplicationsForVolunteer(volunteerId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for volunteer ID: ${volunteerId}`);
    await sleep(100);
    const applicationsData = await loadApplicationsData();

    const applications = applicationsData.filter(app => app.volunteerId === volunteerId);

    console.log(`Returning ${applications.length} applications for volunteer ${volunteerId}.`);
    return applications.map(app => ({
        ...app,
        submittedAt: app.submittedAt instanceof Date ? app.submittedAt : new Date(app.submittedAt)
    }));
}


/**
 * Asynchronously submits a volunteer application/interest form.
 * Adds the application to the in-memory array and writes to the JSON file.
 *
 * @param application The volunteer application data to submit (including volunteerId and status).
 * @returns A promise that resolves to a string indicating the application status.
 */
export async function submitVolunteerApplication(application: Omit<VolunteerApplication, 'id'>): Promise<string> {
  console.log('Submitting volunteer application:', application);
  await sleep(500);
  let applicationsData = await loadApplicationsData(); 

  if (Math.random() < 0.05) { 
     throw new Error('Simulated network error during submission.');
  }

  const newId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newApplication: VolunteerApplication = {
    ...application,
    id: newId,
    submittedAt: new Date(), 
    status: 'submitted',
    attendance: 'pending', // Default attendance
  };

  applicationsData.push(newApplication);
  await writeData(APPLICATIONS_FILE, applicationsData);

  console.log('Application added and saved:', newApplication);

  return `Interest registered successfully! Application ID: ${newId}`;
}

/**
 * Asynchronously updates the status of a volunteer application.
 * Updates the data array and writes to the JSON file.
 *
 * @param applicationId The ID of the application to update.
 * @param status The new status ('accepted' or 'rejected').
 * @returns A promise that resolves to the updated application or throws an error.
 */
export async function updateApplicationStatus(
    applicationId: string,
    status: 'accepted' | 'rejected'
): Promise<VolunteerApplication> {
    console.log(`Updating application ${applicationId} status to ${status}`);
    await sleep(300); 
    let applicationsData = await loadApplicationsData();

    const appIndex = applicationsData.findIndex(app => app.id === applicationId);
    if (appIndex === -1) {
        throw new Error('Application not found.');
    }

    if (Math.random() < 0.05) { 
        throw new Error('Simulated error updating application status.');
    }

    applicationsData[appIndex].status = status;
    applicationsData[appIndex].submittedAt = applicationsData[appIndex].submittedAt instanceof Date ? applicationsData[appIndex].submittedAt : new Date(applicationsData[appIndex].submittedAt);


    await writeData(APPLICATIONS_FILE, applicationsData);

    console.log('Application status updated and saved:', applicationsData[appIndex]);
    return { ...applicationsData[appIndex] };
}

// --- CRUD for Opportunities ---

/**
 * Creates a new volunteer opportunity.
 * @param opportunityData Data for the new opportunity (without ID).
 * @returns The newly created opportunity.
 */
export async function createOpportunity(opportunityData: Omit<Opportunity, 'id'>): Promise<Opportunity> {
    await sleep(300);
    let opportunitiesData = await loadOpportunitiesData();
    const newId = `opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOpportunity: Opportunity = {
      ...opportunityData,
      id: newId,
      pointsAwarded: typeof opportunityData.pointsAwarded === 'number' && opportunityData.pointsAwarded >= 0 ? opportunityData.pointsAwarded : 0,
      imageUrl: opportunityData.imageUrl || undefined,
      createdAt: new Date(), // Add createdAt timestamp
      applicationDeadline: opportunityData.applicationDeadline ? new Date(opportunityData.applicationDeadline) : undefined,
    };

    opportunitiesData.push(newOpportunity);
    await writeData(OPPORTUNITIES_FILE, opportunitiesData);
    console.log('New opportunity created and saved:', newOpportunity);
    return { ...newOpportunity };
}

/**
 * Gets a single opportunity by ID.
 * @param id The ID of the opportunity.
 * @returns The opportunity or undefined if not found.
 */
export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
    await sleep(50);
    const opportunitiesData = await loadOpportunitiesData();
    const opportunity = opportunitiesData.find(opp => opp.id === id);
    if (opportunity) {
      if (opportunity.createdAt) {
        opportunity.createdAt = opportunity.createdAt instanceof Date ? opportunity.createdAt : new Date(opportunity.createdAt);
      }
      if (opportunity.applicationDeadline) {
        opportunity.applicationDeadline = opportunity.applicationDeadline instanceof Date ? opportunity.applicationDeadline : new Date(opportunity.applicationDeadline);
      }
    }
    return opportunity ? { ...opportunity } : undefined;
}

/**
 * Updates an existing application with performance feedback from the organization.
 * @param applicationId The ID of the application to update.
 * @param feedbackData Object containing attendance, rating, and hours logged by org.
 * @returns The updated volunteer application.
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
  await sleep(200);
  let applicationsData = await loadApplicationsData();

  const appIndex = applicationsData.findIndex(app => app.id === applicationId);
  if (appIndex === -1) {
    throw new Error('Application not found to record performance.');
  }

  // Update the application
  applicationsData[appIndex] = {
    ...applicationsData[appIndex],
    ...feedbackData,
    status: feedbackData.attendance === 'present' ? 'completed' : applicationsData[appIndex].status, // Mark as completed if present
    submittedAt: applicationsData[appIndex].submittedAt instanceof Date ? applicationsData[appIndex].submittedAt : new Date(applicationsData[appIndex].submittedAt),
  };

  await writeData(APPLICATIONS_FILE, applicationsData);
  console.log('Volunteer performance recorded and saved:', applicationsData[appIndex]);
  return { ...applicationsData[appIndex] };
}
