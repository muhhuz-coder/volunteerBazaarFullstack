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
  pointsAwarded?: number;
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
  resumeUrl: string;
  coverLetter: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: Date | string; // Allow string during read, convert to Date
}

// File names for JSON data
const OPPORTUNITIES_FILE = 'opportunities.json';
const APPLICATIONS_FILE = 'applications.json';

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Data Loading ---
// Load data dynamically within functions to ensure server-side execution context

async function loadOpportunitiesData(): Promise<Opportunity[]> {
    return await readData<Opportunity[]>(OPPORTUNITIES_FILE, []);
}

async function loadApplicationsData(): Promise<VolunteerApplication[]> {
    const rawApplications = await readData<VolunteerApplication[]>(APPLICATIONS_FILE, []);
    return rawApplications.map(app => ({
        ...app,
        submittedAt: typeof app.submittedAt === 'string' ? new Date(app.submittedAt) : app.submittedAt,
    }));
}


/**
 * Asynchronously retrieves volunteer opportunities based on search keywords and categories.
 * Reads from the loaded data and simulates filtering.
 * @param keywords Keywords to search for in opportunity titles or descriptions.
 * @param category Category to filter opportunities.
 * @returns A promise that resolves to an array of Opportunity objects.
 */
export async function getOpportunities(keywords?: string, category?: string): Promise<Opportunity[]> {
  console.log(`Fetching opportunities with keywords: "${keywords}" and category: "${category}"`);
  await sleep(100); // Simulate minimal delay
  const opportunitiesData = await loadOpportunitiesData();

  let filteredOpportunities = opportunitiesData;

  if (keywords) {
    const lowerKeywords = keywords.toLowerCase();
    filteredOpportunities = filteredOpportunities.filter(opp =>
      opp.title.toLowerCase().includes(lowerKeywords) ||
      opp.organization.toLowerCase().includes(lowerKeywords) ||
      opp.description.toLowerCase().includes(lowerKeywords)
    );
  }

  if (category && category !== 'All') {
     filteredOpportunities = filteredOpportunities.filter(opp => opp.category === category);
  }

  console.log(`Returning ${filteredOpportunities.length} opportunities.`);
  return [...filteredOpportunities]; // Return a copy
}

/**
 * Asynchronously retrieves applications for a specific organization.
 * @param organizationId The ID of the organization.
 * @returns A promise that resolves to an array of VolunteerApplication objects for that org.
 */
export async function getApplicationsForOrganization(organizationId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for organization ID: ${organizationId}`);
    await sleep(100); // Simulate minimal delay
    const opportunitiesData = await loadOpportunitiesData();
    const applicationsData = await loadApplicationsData();

    const orgOpportunities = opportunitiesData.filter(opp => opp.organizationId === organizationId).map(opp => opp.id);
    const applications = applicationsData.filter(app => orgOpportunities.includes(app.opportunityId));

    console.log(`Returning ${applications.length} applications for organization ${organizationId}.`);
    return applications.map(app => ({
        ...app, // Return copies with Date objects
        submittedAt: new Date(app.submittedAt)
    }));
}

/**
 * Asynchronously retrieves applications submitted by a specific volunteer.
 * @param volunteerId The ID of the volunteer.
 * @returns A promise that resolves to an array of VolunteerApplication objects submitted by that volunteer.
 */
export async function getApplicationsForVolunteer(volunteerId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for volunteer ID: ${volunteerId}`);
    await sleep(100); // Simulate minimal delay
    const applicationsData = await loadApplicationsData();

    const applications = applicationsData.filter(app => app.volunteerId === volunteerId);

    console.log(`Returning ${applications.length} applications for volunteer ${volunteerId}.`);
    return applications.map(app => ({
        ...app, // Return copies with Date objects
        submittedAt: new Date(app.submittedAt)
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
  await sleep(500); // Simulate network delay for submission
  let applicationsData = await loadApplicationsData(); // Load current data

  if (Math.random() < 0.05) { // Simulate occasional failure
     throw new Error('Simulated network error during submission.');
  }

  // Generate a simple ID
  const newId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newApplication: VolunteerApplication = {
    ...application,
    id: newId,
    submittedAt: new Date(), // Record submission time
  };

  // Update data and write to file
  applicationsData.push(newApplication);
  await writeData(APPLICATIONS_FILE, applicationsData);

  console.log('Application added and saved:', newApplication);

  // Return success message including the new ID
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
    await sleep(300); // Simulate delay
    let applicationsData = await loadApplicationsData(); // Load current data

    const appIndex = applicationsData.findIndex(app => app.id === applicationId);
    if (appIndex === -1) {
        throw new Error('Application not found.');
    }

    if (Math.random() < 0.05) { // Simulate rare update failure
        throw new Error('Simulated error updating application status.');
    }

    applicationsData[appIndex].status = status;
    applicationsData[appIndex].submittedAt = new Date(applicationsData[appIndex].submittedAt); // Ensure it's a Date object

    // Write updated data to file
    await writeData(APPLICATIONS_FILE, applicationsData);

    console.log('Application status updated and saved:', applicationsData[appIndex]);
    return { ...applicationsData[appIndex] }; // Return a copy
}

// --- CRUD for Opportunities (Example - Add if needed) ---

/**
 * Creates a new volunteer opportunity.
 * @param opportunityData Data for the new opportunity (without ID).
 * @returns The newly created opportunity.
 */
export async function createOpportunity(opportunityData: Omit<Opportunity, 'id'>): Promise<Opportunity> {
    await sleep(300);
    let opportunitiesData = await loadOpportunitiesData(); // Load current data
    const newId = `opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOpportunity: Opportunity = { ...opportunityData, id: newId };

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
    return opportunity ? { ...opportunity } : undefined;
}