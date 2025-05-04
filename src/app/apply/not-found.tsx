import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
     <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-primary">Job Not Found</h2>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find the job you were looking for.</p>
        <Button asChild>
          <Link href="/">Return to Job Listings</Link>
        </Button>
      </div>
    </div>
  );
}
