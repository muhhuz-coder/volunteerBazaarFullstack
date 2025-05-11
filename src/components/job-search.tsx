
'use client';

import * as React from 'react'; // Added React import
import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ListFilter, RotateCcw, MapPinIcon, Briefcase, BookOpen } from 'lucide-react'; 
import { opportunityCategories } from '@/config/constants';

interface OpportunitySearchProps {
  initialKeywords?: string;
  initialCategory?: string;
  initialLocation?: string;
  initialCommitment?: string;
}

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
    router.push(pathname); 
  };

  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="pb-4 pt-5 bg-primary/5 border-b border-border">
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2.5">
          <ListFilter className="h-5 w-5" /> Filter Options
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 md:p-6">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" /> Name / Keywords
            </Label>
            <Input
              id="keywords"
              type="text"
              placeholder="Search by title, org..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-10 text-sm rounded-md" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" /> Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="City, Province, or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-10 text-sm rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Skills / Area
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="w-full bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-10 text-sm rounded-md">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {opportunityCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment" className="text-sm font-medium text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Commitment
            </Label>
            <Select value={commitment} onValueChange={setCommitment}>
              <SelectTrigger id="commitment" className="w-full bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-10 text-sm rounded-md">
                <SelectValue placeholder="Select commitment" />
              </SelectTrigger>
              <SelectContent>
                {commitmentOptions.map((com) => (
                  <SelectItem key={com} value={com} className="text-sm">{com}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-3.5 pt-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-md text-base font-semibold">
              <Search className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="w-full hover:bg-muted/50 h-10 rounded-md text-base">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Add Label component if not globally available or for local styling
const Label = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className="block text-sm font-medium text-foreground"
    {...props}
  />
));
Label.displayName = "Label";
