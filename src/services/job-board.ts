/**
 * Represents a volunteer opportunity posting.
 */
export interface Opportunity {
  /**
   * The unique identifier for the opportunity posting.
   */
  id: string;
  /**
   * The title of the opportunity.
   */
  title: string;
  /**
   * The organization posting the opportunity.
   */
  organization: string;
   /**
   * The ID of the organization posting the opportunity.
   */
   organizationId: string; // Added organization ID
  /**
   * A description of the volunteer role and requirements.
   */
  description: string;
  /**
   * The location of the opportunity (city, state, or Remote).
   */
  location: string;
  /**
   * Commitment or time requirement (e.g., "Flexible", "Weekends", "5 hours/week").
   */
  commitment: string;
  /**
   * The category of the opportunity (e.g., Environment, Education, Healthcare).
   */
  category: string;
   /**
    * Points awarded for completing this opportunity (for gamification).
    */
   pointsAwarded?: number;
}

/**
 * Represents a volunteer application/interest registration.
 */
export interface VolunteerApplication {
  /**
   * The unique identifier for the application. Should ideally be generated server-side.
   */
  id: string;
  /**
   * The ID of the opportunity being applied for.
   */
  opportunityId: string;
   /**
    * The title of the opportunity being applied for (denormalized for easier display).
    */
   opportunityTitle: string;
   /**
    * The ID of the volunteer applying.
    */
   volunteerId: string;
  /**
   * The applicant's name.
   */
  applicantName: string;
  /**
   * The applicant's email address.
   */
  applicantEmail: string;
  /**
   * The path or URL to the applicant's resume or relevant document (after upload).
   */
  resumeUrl: string; // Represents attachment URL
  /**
   * Additional information, statement of interest, or cover letter text.
   */
  coverLetter: string; // Represents statement of interest
   /**
    * The current status of the application.
    */
   status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn'; // Added status
    /**
     * Date the application was submitted.
     */
    submittedAt: Date;
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate database for applications
let mockApplications: VolunteerApplication[] = [];


// Sample volunteer opportunity data
const sampleOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Community Garden Helper',
    organization: 'Green Thumbs Community',
    organizationId: 'org1', // Added ID
    description: 'Assist with planting, weeding, and harvesting in our community garden. No experience necessary, just a willingness to get your hands dirty!',
    location: 'City Park',
    commitment: 'Sat mornings, 9am-12pm',
    category: 'Environment',
    pointsAwarded: 25, // Add points
  },
  {
    id: '2',
    title: 'Youth Reading Tutor',
    organization: 'Readers Are Leaders Foundation',
    organizationId: 'org2', // Added ID
    description: 'Help elementary school students improve their reading skills. Training provided. Background check required.',
    location: 'Downtown Library',
    commitment: '2 hours/week (flexible)',
    category: 'Education',
    pointsAwarded: 30, // Add points
  },
  {
    id: '3',
    title: 'Event Registration Assistant',
    organization: 'Annual Charity Run',
    organizationId: 'org3', // Added ID
    description: 'Help check in participants and distribute race packets for our annual 5k run fundraiser.',
    location: 'Central Plaza',
    commitment: 'June 15th, 7am-10am',
    category: 'Events',
    pointsAwarded: 15, // Add points
  },
   {
    id: '4',
    title: 'Website Content Writer',
    organization: 'Animal Rescue Shelter',
    organizationId: 'org1', // Reusing org1
    description: 'Write engaging descriptions for adoptable animals and update shelter news on our website. Strong writing skills needed.',
    location: 'Remote',
    commitment: 'Flexible, approx. 3-5 hours/week',
    category: 'Animals',
    pointsAwarded: 20, // Add points
  },
   {
    id: '5',
    title: 'Hospital Visitor Companion',
    organization: 'City General Hospital',
    organizationId: 'org4', // Added ID
    description: 'Provide companionship and light assistance to patients. Must be compassionate and reliable. Orientation required.',
    location: 'City General Hospital',
    commitment: 'Min. 4 hours/week',
    category: 'Healthcare',
    pointsAwarded: 40, // Add points
  },
    {
    id: '6',
    title: 'Food Bank Sorter/Packer',
    organization: 'Community Food Bank',
    organizationId: 'org2', // Reusing org2
    description: 'Sort donated food items and pack boxes for distribution to families in need. Physical activity involved.',
    location: 'Warehouse District',
    commitment: 'Weekdays, flexible shifts',
    category: 'Hunger Relief',
    pointsAwarded: 20, // Add points
  },
];


/**
 * Asynchronously retrieves volunteer opportunities based on search keywords and categories.
 * Simulates an API call with filtering.
 * @param keywords Keywords to search for in opportunity titles or descriptions.
 * @param category Category to filter opportunities.
 * @returns A promise that resolves to an array of Opportunity objects.
 */
export async function getOpportunities(keywords?: string, category?: string): Promise<Opportunity[]> {
  console.log(`Fetching opportunities with keywords: "${keywords}" and category: "${category}"`);
  await sleep(500); // Simulate network delay

  let filteredOpportunities = sampleOpportunities;

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
  return filteredOpportunities;
}

/**
 * Asynchronously retrieves applications for a specific organization.
 * @param organizationId The ID of the organization.
 * @returns A promise that resolves to an array of VolunteerApplication objects for that org.
 */
export async function getApplicationsForOrganization(organizationId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for organization ID: ${organizationId}`);
    await sleep(400); // Simulate network delay

    const orgOpportunities = sampleOpportunities.filter(opp => opp.organizationId === organizationId).map(opp => opp.id);
    const applications = mockApplications.filter(app => orgOpportunities.includes(app.opportunityId));

    console.log(`Returning ${applications.length} applications for organization ${organizationId}.`);
    return applications;
}

/**
 * Asynchronously retrieves applications submitted by a specific volunteer.
 * @param volunteerId The ID of the volunteer.
 * @returns A promise that resolves to an array of VolunteerApplication objects submitted by that volunteer.
 */
export async function getApplicationsForVolunteer(volunteerId: string): Promise<VolunteerApplication[]> {
    console.log(`Fetching applications for volunteer ID: ${volunteerId}`);
    await sleep(400); // Simulate network delay

    const applications = mockApplications.filter(app => app.volunteerId === volunteerId);

    console.log(`Returning ${applications.length} applications for volunteer ${volunteerId}.`);
    return applications;
}


/**
 * Asynchronously submits a volunteer application/interest form.
 * Simulates an API call.
 *
 * @param application The volunteer application data to submit (including volunteerId and status).
 * @returns A promise that resolves to a string indicating the application status.
 */
export async function submitVolunteerApplication(application: Omit<VolunteerApplication, 'id'>): Promise<string> {
  console.log('Submitting volunteer application:', application);
  await sleep(1000); // Simulate network delay for submission

  if (Math.random() < 0.1) { // Simulate occasional failure
     throw new Error('Simulated network error during submission.');
  }

  // Generate a simple ID and add to mock database
  const newId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newApplication: VolunteerApplication = {
    ...application,
    id: newId,
    submittedAt: new Date(), // Record submission time
  };
  mockApplications.push(newApplication);
  console.log('Application added to mock DB:', newApplication);

  // Return success message including the new ID
  return `Interest registered successfully! Application ID: ${newId}`;
}

/**
 * Asynchronously updates the status of a volunteer application.
 * Simulates an API call.
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
    await sleep(500); // Simulate delay

    const appIndex = mockApplications.findIndex(app => app.id === applicationId);
    if (appIndex === -1) {
        throw new Error('Application not found.');
    }

    if (Math.random() < 0.05) { // Simulate rare update failure
        throw new Error('Simulated error updating application status.');
    }

    mockApplications[appIndex].status = status;
    console.log('Application status updated in mock DB:', mockApplications[appIndex]);
    return mockApplications[appIndex];
}
