/**
 * Represents a volunteer opportunity posting.
 */
// Renamed from Job to Opportunity
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
  // Renamed from company to organization
  organization: string;
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
  // Changed from salary to commitment
  commitment: string;
  /**
   * The category of the opportunity (e.g., Environment, Education, Healthcare).
   */
  category: string;
}

/**
 * Represents a volunteer application/interest registration.
 */
// Renamed from JobApplication to VolunteerApplication
export interface VolunteerApplication {
  /**
   * The unique identifier for the application. Should ideally be generated server-side.
   */
  id: string;
  /**
   * The ID of the opportunity being applied for.
   */
  // Renamed from jobId to opportunityId
  opportunityId: string;
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
  // Kept as resumeUrl, but context changes
  resumeUrl: string;
  /**
   * Additional information, statement of interest, or cover letter text.
   */
  // Kept as coverLetter, but context changes
  coverLetter: string;
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Sample volunteer opportunity data
// Renamed from sampleJobs to sampleOpportunities
const sampleOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Community Garden Helper',
    organization: 'Green Thumbs Community',
    description: 'Assist with planting, weeding, and harvesting in our community garden. No experience necessary, just a willingness to get your hands dirty!',
    location: 'City Park',
    commitment: 'Sat mornings, 9am-12pm',
    category: 'Environment',
  },
  {
    id: '2',
    title: 'Youth Reading Tutor',
    organization: 'Readers Are Leaders Foundation',
    description: 'Help elementary school students improve their reading skills. Training provided. Background check required.',
    location: 'Downtown Library',
    commitment: '2 hours/week (flexible)',
    category: 'Education',
  },
  {
    id: '3',
    title: 'Event Registration Assistant',
    organization: 'Annual Charity Run',
    description: 'Help check in participants and distribute race packets for our annual 5k run fundraiser.',
    location: 'Central Plaza',
    commitment: 'June 15th, 7am-10am',
    category: 'Events',
  },
   {
    id: '4',
    title: 'Website Content Writer',
    organization: 'Animal Rescue Shelter',
    description: 'Write engaging descriptions for adoptable animals and update shelter news on our website. Strong writing skills needed.',
    location: 'Remote',
    commitment: 'Flexible, approx. 3-5 hours/week',
    category: 'Animals',
  },
   {
    id: '5',
    title: 'Hospital Visitor Companion',
    organization: 'City General Hospital',
    description: 'Provide companionship and light assistance to patients. Must be compassionate and reliable. Orientation required.',
    location: 'City General Hospital',
    commitment: 'Min. 4 hours/week',
    category: 'Healthcare',
  },
    {
    id: '6',
    title: 'Food Bank Sorter/Packer',
    organization: 'Community Food Bank',
    description: 'Sort donated food items and pack boxes for distribution to families in need. Physical activity involved.',
    location: 'Warehouse District',
    commitment: 'Weekdays, flexible shifts',
    category: 'Hunger Relief',
  },
];


/**
 * Asynchronously retrieves volunteer opportunities based on search keywords and categories.
 * Simulates an API call with filtering.
 * @param keywords Keywords to search for in opportunity titles or descriptions.
 * @param category Category to filter opportunities.
 * @returns A promise that resolves to an array of Opportunity objects.
 */
// Renamed from getJobs to getOpportunities
export async function getOpportunities(keywords?: string, category?: string): Promise<Opportunity[]> {
  // Updated log message
  console.log(`Fetching opportunities with keywords: "${keywords}" and category: "${category}"`);
  await sleep(500); // Simulate network delay

  // TODO: Replace this with an actual API call to your backend or a third-party service.
  // Example: const response = await fetch(`/api/opportunities?keywords=${keywords}&category=${category}`);
  // const opportunities = await response.json();

  // Use updated sample data
  let filteredOpportunities = sampleOpportunities;

  if (keywords) {
    const lowerKeywords = keywords.toLowerCase();
    filteredOpportunities = filteredOpportunities.filter(opp =>
      opp.title.toLowerCase().includes(lowerKeywords) ||
      opp.organization.toLowerCase().includes(lowerKeywords) || // Changed from company
      opp.description.toLowerCase().includes(lowerKeywords)
    );
  }

  if (category && category !== 'All') {
     // Filter by category
     filteredOpportunities = filteredOpportunities.filter(opp => opp.category === category);
  }

  // Updated log message
  console.log(`Returning ${filteredOpportunities.length} opportunities.`);
  return filteredOpportunities;
}

/**
 * Asynchronously submits a volunteer application/interest form.
 * Simulates an API call.
 *
 * @param application The volunteer application data to submit.
 * @returns A promise that resolves to a string indicating the application status.
 */
// Renamed from submitApplication to submitVolunteerApplication
// Parameter type updated
export async function submitVolunteerApplication(application: Omit<VolunteerApplication, 'id'>): Promise<string> {
  console.log('Submitting volunteer application:', application);
  await sleep(1000); // Simulate network delay for submission

  // TODO: Replace this with an actual API call to your backend.
  // Example:
  // const response = await fetch('/api/volunteer-applications', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(application),
  // });
  // if (!response.ok) {
  //   throw new Error('Application submission failed');
  // }
  // const result = await response.json();
  // return result.message || 'Application submitted successfully!';

  // Simulate success
  if (Math.random() < 0.1) { // Simulate occasional failure
     throw new Error('Simulated network error during submission.');
  }

  // Updated success message
  return `Interest registered for opportunity ID ${application.opportunityId} successfully!`;
}
