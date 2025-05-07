// src/components/volunteer-list.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { UserProfile } from '@/context/AuthContext';
import { VolunteerCard } from '@/components/volunteer-card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VolunteerListProps {
  initialVolunteers: UserProfile[];
  currentView?: 'grid' | 'list';
  currentSortBy?: string; // e.g., 'points_desc'
}

const sortOptions = [
  { value: 'points_desc', label: 'Top Volunteers (Points)' },
  { value: 'hours_desc', label: 'Most Active (Hours)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];


export function VolunteerList({
  initialVolunteers,
  currentView = 'grid', // Default to horizontal scroll grid
  currentSortBy = 'points_desc',
}: VolunteerListProps) {
  const volunteers = initialVolunteers;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleViewChange = (view: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortValue);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (volunteers.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8 py-10 bg-card rounded-lg border shadow-md">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No volunteers found.</p>
        <p className="text-sm">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2 justify-between md:justify-end items-center">
        <Select value={currentSortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full md:w-auto md:min-w-[200px] h-9 text-sm bg-card border-border shadow-sm">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-md bg-card border border-border p-0.5 shadow-sm">
          <Button
            variant={currentView === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('grid')}
            className={cn("h-8 px-3", currentView === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}
            aria-label="Grid view (horizontal scroll)"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={currentView === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('list')}
            className={cn("h-8 px-3", currentView === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentView === 'grid' ? (
        <div className="flex overflow-x-auto space-x-4 pb-4 scroll-smooth scroll-snap-x-mandatory hide-scrollbar">
          {volunteers.map((volunteer) => (
            <VolunteerCard key={volunteer.id} volunteer={volunteer} view="grid" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {volunteers.map((volunteer) => (
            <VolunteerCard key={volunteer.id} volunteer={volunteer} view="list" />
          ))}
        </div>
      )}
    </>
  );
}
