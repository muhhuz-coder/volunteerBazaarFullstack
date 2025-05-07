// src/components/volunteer-card.tsx
'use client';

import Link from 'next/link';
import type { UserProfile } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Star, Clock, UserCheck, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VolunteerCardProps {
  volunteer: UserProfile;
  view?: 'grid' | 'list'; // To control card layout style
}

export function VolunteerCard({ volunteer, view = 'grid' }: VolunteerCardProps) {
  const getInitials = (name?: string | null): string => {
    if (!name) return 'V';
    const names = name.split(' ');
    if (names.length === 1 && name.length > 0) return name[0].toUpperCase();
    if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.length > 0 ? name[0].toUpperCase() : 'V';
  };

  // Use nullish coalescing for each stat property for robustness
  const displayStats = {
    points: volunteer.stats?.points ?? 0,
    badges: volunteer.stats?.badges ?? [],
    hours: volunteer.stats?.hours ?? 0,
  };

  return (
    <Card className={cn(
      "flex group overflow-hidden transition-all duration-300 ease-in-out border",
      view === 'grid'
        ? "flex-col card-hover-effect min-w-[280px] w-[280px] md:min-w-[300px] md:w-[300px] scroll-snap-align-start"
        : "flex-row items-start hover:shadow-lg bg-card w-full" // List view wider
    )}>
      <div className={cn(
        "relative flex-shrink-0 flex items-center justify-center",
        view === 'grid' ? 'h-40 w-full bg-muted/30' : 'h-full w-1/3 md:w-1/4 bg-muted/30 p-4'
      )}>
        <Avatar className={cn(
          "border-4 border-primary/10 shadow-md",
          view === 'grid' ? "h-24 w-24" : "h-28 w-28 md:h-32 md:w-32"
        )}>
          {volunteer.profilePictureUrl ? (
            <AvatarImage src={volunteer.profilePictureUrl} alt={volunteer.displayName} className="object-cover" />
          ) : (
            <AvatarFallback className={cn(
              "bg-primary/20 text-primary font-semibold",
              view === 'grid' ? "text-3xl" : "text-4xl"
            )}>
              {getInitials(volunteer.displayName)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      <div className={cn("flex flex-col flex-grow p-4", view === 'list' ? 'w-2/3 md:w-1/2' : '')}>
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-lg md:text-xl font-semibold text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2">
            {volunteer.displayName}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground pt-0.5 line-clamp-1">
            Volunteer
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-2 text-xs md:text-sm flex-grow mt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>{displayStats.points} Points</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Award className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span>{displayStats.badges.length} Badge{displayStats.badges.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span>{displayStats.hours} Hours Logged</span>
          </div>
           {/* Display a few badges if available */}
           {displayStats.badges.length > 0 && view === 'grid' && (
             <div className="pt-2 line-clamp-2">
               {displayStats.badges.slice(0, 3).map((badge, index) => (
                 <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">{badge}</Badge>
               ))}
               {displayStats.badges.length > 3 && <span className="text-xs text-muted-foreground">...</span>}
             </div>
           )}
        </CardContent>

        {view === 'grid' && (
          <CardFooter className="p-0 pt-3 flex justify-end items-center border-t mt-3">
            <Button asChild variant="link" size="sm" className="text-accent p-0 h-auto font-medium group-hover:underline">
              {/* Link to a future /volunteers/[id] page or disable */}
              <span className="flex items-center gap-1 cursor-not-allowed opacity-50">
                View Profile <Eye className="h-4 w-4" />
              </span>
              {/* <Link href={`/volunteers/${volunteer.id}`} className="flex items-center gap-1">
                View Profile <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
              </Link> */}
            </Button>
          </CardFooter>
        )}
      </div>
      
      {view === 'list' && (
        <div className="w-full md:w-1/4 p-4 border-l flex-shrink-0 flex flex-col justify-center items-start space-y-3 bg-card/50 md:bg-transparent">
            {displayStats.badges.length > 0 && (
                 <div className="text-xs">
                     <p className="font-medium text-muted-foreground mb-1">Top Badges</p>
                     <div className="flex flex-wrap gap-1">
                        {displayStats.badges.slice(0, 2).map((badge, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{badge}</Badge>
                        ))}
                        {displayStats.badges.length > 2 && <Badge variant="outline" className="text-xs">+{displayStats.badges.length-2} more</Badge>}
                     </div>
                 </div>
            )}
             <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto" disabled>
                {/* Placeholder for future profile view */}
                <span className="flex items-center justify-center gap-1.5">
                    <UserCheck className="h-4 w-4" /> View Full Profile
                </span>
                {/* <Link href={`/volunteers/${volunteer.id}`}>View Profile</Link> */}
            </Button>
        </div>
      )}
    </Card>
  );
}
