/**
 * Represents a job posting with relevant details.
 */
export interface Job {
  /**
   * The unique identifier for the job posting.
   */
  id: string;
  /**
   * The title of the job.
   */
  title: string;
  /**
   * The company posting the job.
   */
  company: string;
  /**
   * A description of the job responsibilities and requirements.
   */
  description: string;
  /**
   * The location of the job (city, state).
   */
  location: string;
  /**
   * The salary range for the job. Can be a string like "$100k - $120k" or "Competitive".
   */
  salary: string;
  /**
   * The category of the job (e.g., Engineering, Marketing).
   */
  category: string; // Ensure category is part of the Job type
}

/**
 * Represents a job application.
 */
export interface JobApplication {
  /**
   * The unique identifier for the job application. Should ideally be generated server-side.
   */
  id: string;
  /**
   * The ID of the job being applied for.
   */
  jobId: string;
  /**
   * The applicant's name.
   */
  applicantName: string;
  /**
   * The applicant's email address.
   */
  applicantEmail: string;
  /**
   * The path or URL to the applicant's resume (after upload).
   */
  resumeUrl: string;
  /**
   * Additional information or cover letter text.
   */
  coverLetter: string;
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Sample job data
const sampleJobs: Job[] = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'Web Solutions Inc.',
    description: 'Seeking a skilled Frontend Developer to build responsive and engaging user interfaces using React and Tailwind CSS. Experience with Next.js is a plus.',
    location: 'Remote',
    salary: '$110,000 - $140,000',
    category: 'Engineering',
  },
  {
    id: '2',
    title: 'Digital Marketing Specialist',
    company: 'Growth Experts Co.',
    description: 'Manage digital marketing campaigns across various channels including SEO, SEM, and social media. Analyze performance and optimize strategies.',
    location: 'New York, NY',
    salary: '$85,000 - $110,000',
    category: 'Marketing',
  },
  {
    id: '3',
    title: 'Backend Engineer (Node.js)',
    company: 'Server Systems Ltd.',
    description: 'Design, develop, and maintain robust backend services and APIs using Node.js, Express, and PostgreSQL. Focus on scalability and performance.',
    location: 'Austin, TX',
    salary: '$130,000 - $160,000',
    category: 'Engineering',
  },
   {
    id: '4',
    title: 'UX/UI Designer',
    company: 'Creative Designs Studio',
    description: 'Create intuitive and visually appealing user experiences for web and mobile applications. Collaborate with product managers and developers.',
    location: 'San Francisco, CA',
    salary: '$100,000 - $130,000',
    category: 'Design',
  },
   {
    id: '5',
    title: 'Product Manager',
    company: 'Innovate Tech',
    description: 'Define product strategy, gather requirements, and manage the product lifecycle from conception to launch. Work closely with cross-functional teams.',
    location: 'Seattle, WA',
    salary: '$140,000 - $170,000',
    category: 'Product',
  },
    {
    id: '6',
    title: 'Sales Development Representative',
    company: 'SalesForce (Example)',
    description: 'Generate leads and qualify prospects for the sales team. Conduct outreach via email, phone, and social media.',
    location: 'Chicago, IL',
    salary: '$60,000 - $80,000 + Commission',
    category: 'Sales',
  },
];


/**
 * Asynchronously retrieves job postings based on search keywords and categories.
 * Simulates an API call with filtering.
 * @param keywords Keywords to search for in job titles or descriptions.
 * @param category Category to filter job postings.
 * @returns A promise that resolves to an array of Job objects.
 */
export async function getJobs(keywords?: string, category?: string): Promise<Job[]> {
  console.log(`Fetching jobs with keywords: "${keywords}" and category: "${category}"`);
  await sleep(500); // Simulate network delay

  // TODO: Replace this with an actual API call to your backend or a third-party service.
  // Example: const response = await fetch(`/api/jobs?keywords=${keywords}&category=${category}`);
  // const jobs = await response.json();

  let filteredJobs = sampleJobs;

  if (keywords) {
    const lowerKeywords = keywords.toLowerCase();
    filteredJobs = filteredJobs.filter(job =>
      job.title.toLowerCase().includes(lowerKeywords) ||
      job.company.toLowerCase().includes(lowerKeywords) ||
      job.description.toLowerCase().includes(lowerKeywords)
    );
  }

  if (category && category !== 'All') {
     filteredJobs = filteredJobs.filter(job => job.category === category);
  }


  console.log(`Returning ${filteredJobs.length} jobs.`);
  return filteredJobs;
}

/**
 * Asynchronously submits a job application.
 * Simulates an API call.
 *
 * @param application The job application data to submit.
 * @returns A promise that resolves to a string indicating the application status.
 */
export async function submitApplication(application: Omit<JobApplication, 'id'>): Promise<string> {
  console.log('Submitting application:', application);
  await sleep(1000); // Simulate network delay for submission

  // TODO: Replace this with an actual API call to your backend.
  // This call should handle saving the application data (including the uploaded resume URL).
  // Example:
  // const response = await fetch('/api/applications', {
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

  return `Application for job ID ${application.jobId} submitted successfully!`;
}
