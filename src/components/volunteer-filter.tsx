// src/components/volunteer-filter.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ListFilter, RotateCcw, Users, Award, Clock } from 'lucide-react'; // Added more specific icons

interface VolunteerFilterProps {
  initialKeywords?: string;
  initialSortBy?: string;
}

const sortOptions = [
  { value: 'points_desc', label: 'Top Volunteers (Points)', icon: Award },
  { value: 'hours_desc', label: 'Most Active (Hours)', icon: Clock },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

export function VolunteerFilter({
  initialKeywords = '',
  initialSortBy = 'points_desc', // Default sort
}: VolunteerFilterProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [sortBy, setSortBy] = useState(initialSortBy);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Update state if URL params change (e.g., browser back/forward)
  useEffect(() => {
    setKeywords(searchParams.get('keywords') || '');
    setSortBy(searchParams.get('sortBy') || 'points_desc');
  }, [searchParams]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (keywords) params.set('keywords', keywords); else params.delete('keywords');
    if (sortBy) params.set('sortBy', sortBy); else params.delete('sortBy');
    
    // Preserve other existing params like 'view'
    const currentView = searchParams.get('view');
    if (currentView) params.set('view', currentView);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setKeywords('');
    setSortBy('points_desc');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('keywords');
    params.delete('sortBy');
    // Preserve 'view' param if it exists
    const currentView = searchParams.get('view');
    if (currentView) params.set('view', currentView); else params.delete('view');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="shadow-lg border sticky top-20">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <ListFilter className="mr-2 h-5 w-5" /> Filter Volunteers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFilterSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="keywords" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Search className="h-4 w-4 text-muted-foreground" /> Name
            </label>
            <Input
              id="keywords"
              type="text"
              placeholder="Search by name..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-input border-border focus:border-primary focus:ring-primary/50 text-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="sortBy" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" /> Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sortBy" className="w-full bg-input border-border focus:border-primary focus:ring-primary/50 text-sm">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    <div className="flex items-center gap-2">
                      {opt.icon && <opt.icon className="h-4 w-4 text-muted-foreground" />}
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-3 pt-3">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Search className="mr-2 h-4 w-4" /> Apply Filters
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
