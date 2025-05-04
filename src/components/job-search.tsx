
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Activity, SlidersHorizontal } from 'lucide-react';
import { opportunityCategories } from '@/config/constants'; // Import categories

interface OpportunitySearchProps {
  initialKeywords?: string;
  initialCategory?: string;
}

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
    <form onSubmit={handleSearch} className="bg-card p-6 rounded-lg shadow-xl border mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        {/* Keyword Search */}
        <div className="space-y-2">
          <label htmlFor="keywords" className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Search className="h-4 w-4" />
            Keywords
          </label>
          <Input
            id="keywords"
            type="text"
            placeholder="Opportunity title, organization, or skill"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-background border-border focus:border-primary focus:ring-primary/50"
          />
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
             Area of Interest
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full bg-background border-border focus:border-primary focus:ring-primary/50">
              <SelectValue placeholder="Select area of interest" />
            </SelectTrigger>
            <SelectContent>
              {opportunityCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground h-10">
          <Search className="mr-2 h-4 w-4" /> Search Opportunities
        </Button>
      </div>
       {/* Optional: Add advanced filters button */}
       {/*
       <div className="mt-4 flex justify-end">
           <Button variant="outline" size="sm">
               <SlidersHorizontal className="mr-2 h-4 w-4" /> Advanced Filters
           </Button>
       </div>
        */}
    </form>
  );
}
