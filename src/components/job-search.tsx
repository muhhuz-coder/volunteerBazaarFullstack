'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Briefcase, Settings } from 'lucide-react'; // Added Settings icon

// Example categories - replace or fetch dynamically
const jobCategories = ['All', 'Engineering', 'Marketing', 'Sales', 'Design', 'Product'];

interface JobSearchProps {
  initialKeywords?: string;
  initialCategory?: string;
}

export function JobSearch({ initialKeywords = '', initialCategory = 'All' }: JobSearchProps) {
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
            placeholder="Job title, company, or skill"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
             Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full bg-background">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {jobCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Search className="mr-2 h-4 w-4" /> Search Jobs
        </Button>
      </div>
    </form>
  );
}
