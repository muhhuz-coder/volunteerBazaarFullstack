import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react'; // Using a different icon

export default function NotFound() {
  return (
     <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-primary">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">Sorry, the page you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
       {/* Basic Footer */}
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}
