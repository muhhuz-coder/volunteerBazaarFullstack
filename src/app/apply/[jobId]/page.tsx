import { getJobs } from '@/services/job-board';
import { Header } from '@/components/layout/header';
import { ApplicationForm } from '@/components/application-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';

export default async function ApplyPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  // Fetch all jobs first, then find the specific one.
  // In a real scenario, you'd fetch only the specific job by ID.
  const jobs = await getJobs();
  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    notFound(); // Show 404 if job not found
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Apply for {job.title}</CardTitle>
            <CardDescription>Submit your application for the position at {job.company}.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationForm job={job} />
          </CardContent>
        </Card>
      </div>
      {/* Footer can be added here later */}
    </div>
  );
}

// Optional: Add generateStaticParams if needed for static site generation
// export async function generateStaticParams() {
//   const jobs = await getJobs();
//   return jobs.map((job) => ({
//     jobId: job.id,
//   }));
// }
