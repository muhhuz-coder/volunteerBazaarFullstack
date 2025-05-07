
'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ListFilter, RotateCcw, MapPinIcon, Briefcase, BookOpen } from 'lucide-react'; // Added more specific icons
import { opportunityCategories } from '@/config/constants';

interface OpportunitySearchProps {
  initialKeywords?: string;
  initialCategory?: string;
  initialLocation?: string;
  initialCommitment?: string;
}

// Sample data for filters - replace with dynamic data if available
const commitmentOptions = ['All', 'Full-time', 'Part-time', 'Flexible', 'Event-based', 'Short-term', 'Long-term'];


export function OpportunitySearch({
  initialKeywords = '',
  initialCategory = 'All',
  initialLocation = '',
  initialCommitment = 'All',
}: OpportunitySearchProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(initialLocation);
  const [commitment, setCommitment] = useState(initialCommitment);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (keywords) params.set('keywords', keywords); else params.delete('keywords');
    if (category && category !== 'All') params.set('category', category); else params.delete('category');
    if (location) params.set('location', location); else params.delete('location');
    if (commitment && commitment !== 'All') params.set('commitment', commitment); else params.delete('commitment');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setKeywords('');
    setCategory('All');
    setLocation('');
    setCommitment('All');
    router.push(pathname); // Clear all query params
  };

  return (
    <Card className="shadow-lg border sticky top-20"> {/* Make sidebar sticky */}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <ListFilter className="mr-2 h-5 w-5" /> Filter Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-5">
          {/* Keywords (Name) */}
          <div className="space-y-1.5">
            <label htmlFor="keywords" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Search className="h-4 w-4 text-muted-foreground" /> Name / Keywords
            </label>
            <Input
              id="keywords"
              type="text"
              placeholder="Search by title, org..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-input border-border focus:border-primary focus:ring-primary/50 text-sm"
            />
          </div>

          {/* Location (Province/City combined for now) */}
          <div className="space-y-1.5">
            <label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" /> Location
            </label>
            <Input
              id="location"
              type="text"
              placeholder="City, Province, or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-input border-border focus:border-primary focus:ring-primary/50 text-sm"
            />
          </div>
          
          {/* Category (Skills) */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Skills / Area
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="w-full bg-input border-border focus:border-primary focus:ring-primary/50 text-sm">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {opportunityCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commitment (Education placeholder) */}
          <div className="space-y-1.5">
            <label htmlFor="commitment" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Commitment
            </label>
            <Select value={commitment} onValueChange={setCommitment}>
              <SelectTrigger id="commitment" className="w-full bg-input border-border focus:border-primary focus:ring-primary/50 text-sm">
                <SelectValue placeholder="Select commitment" />
              </SelectTrigger>
              <SelectContent>
                {commitmentOptions.map((com) => (
                  <SelectItem key={com} value={com} className="text-sm">{com}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-3 pt-3">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="w-full hover:bg-muted/50">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
