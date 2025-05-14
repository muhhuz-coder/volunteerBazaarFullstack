"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPinIcon, ClockIcon, Star, Users, Clock, Tag } from "lucide-react";

interface EventResponse {
  response: string;
  events: string[];
  metadata: {
    type: string;
    top_k: number;
  };
}

interface ParsedEvent {
  title: string;
  city: string;
  organization: string;
  eventType: string;
  dateTime: string;
  rating: number;
  volunteersEngaged: number;
  duration: string;
}

export default function EventRecommendationsPage() {
  const [query, setQuery] = useState<string>("Show me upcoming events in Lahore");
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const parseEventString = (eventStr: string): ParsedEvent => {
    const lines = eventStr.split('\n');
    const parsedEvent: Partial<ParsedEvent> = {};
    
    lines.forEach(line => {
      if (line.startsWith('Event Title:')) {
        parsedEvent.title = line.replace('Event Title:', '').trim();
      } else if (line.startsWith('City:')) {
        parsedEvent.city = line.replace('City:', '').trim();
      } else if (line.startsWith('Organization:')) {
        parsedEvent.organization = line.replace('Organization:', '').trim();
      } else if (line.startsWith('Event Type:')) {
        parsedEvent.eventType = line.replace('Event Type:', '').trim();
      } else if (line.startsWith('Date & Time:')) {
        parsedEvent.dateTime = line.replace('Date & Time:', '').trim();
      } else if (line.startsWith('Rating:')) {
        parsedEvent.rating = parseInt(line.replace('Rating:', '').trim(), 10);
      } else if (line.startsWith('Volunteers Engaged:')) {
        parsedEvent.volunteersEngaged = parseInt(line.replace('Volunteers Engaged:', '').trim(), 10);
      } else if (line.startsWith('Duration:')) {
        parsedEvent.duration = line.replace('Duration:', '').trim();
      }
    });
    
    return parsedEvent as ParsedEvent;
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://0680-34-142-204-118.ngrok-free.app/volunteer/events", {
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
        throw new Error("Failed to fetch events");
      }

      const data: EventResponse = await response.json();
      if (data.events && Array.isArray(data.events)) {
        const parsedEvents = data.events.map(parseEventString);
        setEvents(parsedEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError("Failed to load event recommendations. Please try again.");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">Event Recommendations</h1>
      <p className="text-gray-600 mb-6">
        Discover events tailored to your interests and location
      </p>
      
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="What kind of events are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button onClick={fetchEvents} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

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
      ) : events.length > 0 ? (
        <div className="grid gap-6">
          {events.map((event, index) => (
            <Card key={index} className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                {event.organization && (
                  <CardDescription>
                    Organized by {event.organization}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-4">
                  {renderRatingStars(event.rating)}
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1 text-primary/70" />
                    <span>{event.volunteersEngaged} volunteers engaged</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-4">
                  {event.city && (
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1 text-primary/70" />
                      <span>{event.city}</span>
                    </div>
                  )}
                  {event.dateTime && (
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1 text-primary/70" />
                      <span>{event.dateTime}</span>
                    </div>
                  )}
                  {event.duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-primary/70" />
                      <span>{event.duration}</span>
                    </div>
                  )}
                  {event.eventType && (
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1 text-primary/70" />
                      <span>{event.eventType}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="mr-2">
                  More Details
                </Button>
                <Button>Register Interest</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-lg mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">
            Try a different search query or location
          </p>
        </div>
      )}
    </div>
  );
} 