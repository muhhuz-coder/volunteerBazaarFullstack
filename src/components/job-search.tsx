'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Updated icons: Search, Briefcase -> Activity, Settings -> SlidersHorizontal (or similar)
import { Search, Activity, SlidersHorizontal } from 'lucide-react';

// Example opportunity categories - replace or fetch dynamically
const opportunityCategories = [
    'All',
    'Environment',
    'Education',
    'Healthcare',
    'Animals',
    'Community Development',
    'Events',
    'Hunger Relief',
    'Arts & Culture'
];

interface OpportunitySearchProps {
  initialKeywords?: string;
  initialCategory?: string;
}

// Renamed component from JobSearch to OpportunitySearch
export function OpportunitySearch({ initialKeywords = '', initialCategory = 'All' }: OpportunitySearchProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [category, setCategory] = useState(initialCategory);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keywords) {
      params.set('keywords', keywords);
    }
    if (category && category !== 'All') {
      params.set('category', category);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    // Updated heading comment
    <form onSubmit={handleSearch} className="bg-card p-6 rounded-lg shadow-md border mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Keyword Search */}
        <div className="space-y-2">
          <label htmlFor="keywords" className="text-sm font-medium text-foreground flex items-center gap-1">
            <Search className="h-4 w-4" />
            Keywords
          </label>
          <Input
            id="keywords"
            type="text"
            // Updated placeholder
            placeholder="Opportunity title, organization, or skill"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground flex items-center gap-1">
             {/* Updated icon and label */}
            <Activity className="h-4 w-4" />
             Area of Interest
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full bg-background">
              {/* Updated placeholder */}
              <SelectValue placeholder="Select area of interest" />
            </SelectTrigger>
            <SelectContent>
               {/* Use updated category list */}
              {opportunityCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        {/* Updated button text */}
        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Search className="mr-2 h-4 w-4" /> Search Opportunities
        </Button>
      </div>
       {/* Optional: Add advanced filters button - uncomment if needed
       <div className="mt-4 flex justify-end">
           <Button variant="outline" size="sm">
               <SlidersHorizontal className="mr-2 h-4 w-4" /> Advanced Filters
           </Button>
       </div>
        */}
    </form>
  );
}
