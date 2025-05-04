import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <Briefcase className="h-7 w-7" />
          <span>Job Board Lite</span>
        </Link>
        {/* Navigation Links can be added here later */}
        {/* Example:
        <nav>
          <Link href="/dashboard" className="hover:text-accent">Dashboard</Link>
        </nav>
        */}
      </div>
    </header>
  );
}
