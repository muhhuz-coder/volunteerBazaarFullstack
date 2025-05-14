"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIcon, MapPinIcon, Star, Sparkles, BadgeCheck, Mail, Briefcase, School, GraduationCap, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VolunteerResponse {
  response: string;
  volunteers: string[];
  metadata: {
    type: string;
    top_k: number;
  };
}

interface ParsedVolunteer {
  name: string;
  city: string;
  province: string;
  skills: string[];
  causes: string[];
  eventTypes: string[];
  bio: string;
  degree: string;
  field: string;
  university: string;
  employmentStatus: string;
  rating: number;
}

export default function VolunteerRecommendationsPage() {
  const [query, setQuery] = useState<string>("Find volunteers for a blood donation drive");
  const [volunteers, setVolunteers] = useState<ParsedVolunteer[]>([]);
  const [responseText, setResponseText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const parseVolunteerString = (volunteerStr: string): ParsedVolunteer => {
    const volunteerInfo: Partial<ParsedVolunteer> = {
      skills: [],
      causes: [],
      eventTypes: []
    };
    
    const lines = volunteerStr.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('Volunteer Name:')) {
        volunteerInfo.name = line.replace('Volunteer Name:', '').trim();
      } else if (line.startsWith('City:')) {
        volunteerInfo.city = line.replace('City:', '').trim();
      } else if (line.startsWith('Province:')) {
        volunteerInfo.province = line.replace('Province:', '').trim();
      } else if (line.startsWith('Skills:')) {
        volunteerInfo.skills = line.replace('Skills:', '').trim().split(',').map(skill => skill.trim());
      } else if (line.startsWith('Causes Interested In:')) {
        volunteerInfo.causes = line.replace('Causes Interested In:', '').trim().split(',').map(cause => cause.trim());
      } else if (line.startsWith('Event Types:')) {
        volunteerInfo.eventTypes = line.replace('Event Types:', '').trim().split(',').map(type => type.trim());
      } else if (line.startsWith('Bio:')) {
        volunteerInfo.bio = line.replace('Bio:', '').trim();
      } else if (line.startsWith('Degree:')) {
        volunteerInfo.degree = line.replace('Degree:', '').trim();
      } else if (line.startsWith('Field:')) {
        volunteerInfo.field = line.replace('Field:', '').trim();
      } else if (line.startsWith('University:')) {
        volunteerInfo.university = line.replace('University:', '').trim();
      } else if (line.startsWith('Employment Status:')) {
        volunteerInfo.employmentStatus = line.replace('Employment Status:', '').trim();
      } else if (line.startsWith('Rating:')) {
        const ratingStr = line.replace('Rating:', '').trim();
        volunteerInfo.rating = parseFloat(ratingStr);
      }
    });
    
    return volunteerInfo as ParsedVolunteer;
  };

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://c565-34-122-232-18.ngrok-free.app/organization/volunteers", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          top_k: 3,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch volunteer recommendations");
      }

      const data: VolunteerResponse = await response.json();
      if (data.volunteers && Array.isArray(data.volunteers)) {
        const parsedVolunteers = data.volunteers.map(parseVolunteerString);
        setVolunteers(parsedVolunteers);
        setResponseText(data.response || "");
      } else {
        setVolunteers([]);
        setResponseText("");
      }
    } catch (err) {
      setError("Failed to load volunteer recommendations. Please try again.");
      console.error("Error fetching volunteers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchVolunteers();
  }, []);

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
          />
        ))}
        <span className="text-sm ml-1">
          {rating > 0 ? rating.toFixed(1) : "No rating"}
        </span>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">Volunteer Recommendations</h1>
      <p className="text-gray-600 mb-6">
        Find the perfect volunteers for your organization's needs
      </p>
      
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="What kind of volunteers are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button onClick={fetchVolunteers} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {responseText && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-md mb-6">
          <h3 className="font-medium mb-1">AI Suggestions</h3>
          <p className="text-sm text-gray-600">{responseText}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : volunteers.length > 0 ? (
        <div className="grid gap-6">
          {volunteers.map((volunteer, index) => (
            <Card key={index} className="w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-primary/80" />
                      {volunteer.name}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      {volunteer.city}, {volunteer.province}
                    </CardDescription>
                  </div>
                  <div>{renderRating(volunteer.rating)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary/70" />
                      Education
                    </div>
                    <div className="text-sm">
                      <p><span className="font-medium">Degree:</span> {volunteer.degree}</p>
                      <p><span className="font-medium">Field:</span> {volunteer.field}</p>
                      <p><span className="font-medium">University:</span> {volunteer.university}</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-primary/70" />
                      Professional Status
                    </div>
                    <div className="text-sm">
                      <p><span className="font-medium">Status:</span> {volunteer.employmentStatus}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary/70" />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteer.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-primary/70" />
                    Causes Interested In
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteer.causes.map((cause, idx) => (
                      <Badge key={idx} variant="outline" className="bg-primary/5 border-primary/20">
                        {cause}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-primary/70" />
                    Event Types
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteer.eventTypes.map((type, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-accent/10 border-accent/30 text-accent-foreground font-normal">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {volunteer.bio && (
                  <div>
                    <div className="text-sm font-medium mb-2">Bio</div>
                    <div className="text-sm text-gray-600 max-h-32 overflow-y-auto pr-2">
                      {volunteer.bio}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex justify-end w-full gap-2">
                  <Button variant="outline" className="mr-2">
                    View Full Profile
                  </Button>
                  <Button>Contact Volunteer</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-lg mb-2">No matching volunteers found</h3>
          <p className="text-gray-600 mb-4">
            Try a different search query or broaden your requirements
          </p>
        </div>
      )}
    </div>
  );
} 