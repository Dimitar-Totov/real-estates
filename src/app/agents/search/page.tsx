"use client";

import { useState, useMemo } from "react";
import AgentCard from "@/components/AgentCard";
import AgentFilters from "@/components/AgentFilters";

// Hardcoded agent data
const AGENTS = [
  {
    id: "1",
    name: "Sarah Johnson",
    specialty: "Residential Sales",
    city: "New York",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    rating: 4.9,
    reviews: 127,
    experience: 8,
    phone: "(555) 123-4567",
    email: "sarah.johnson@realestate.com",
  },
  {
    id: "2",
    name: "Michael Chen",
    specialty: "Commercial Real Estate",
    city: "Los Angeles",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    rating: 4.8,
    reviews: 89,
    experience: 12,
    phone: "(555) 234-5678",
    email: "michael.chen@realestate.com",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    specialty: "Luxury Homes",
    city: "Chicago",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    rating: 5.0,
    reviews: 156,
    experience: 10,
    phone: "(555) 345-6789",
    email: "emily.rodriguez@realestate.com",
  },
  {
    id: "4",
    name: "David Thompson",
    specialty: "Investment Properties",
    city: "Houston",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    rating: 4.7,
    reviews: 94,
    experience: 15,
    phone: "(555) 456-7890",
    email: "david.thompson@realestate.com",
  },
  {
    id: "5",
    name: "Lisa Park",
    specialty: "Rental Management",
    city: "Phoenix",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    rating: 4.6,
    reviews: 78,
    experience: 6,
    phone: "(555) 567-8901",
    email: "lisa.park@realestate.com",
  },
  {
    id: "6",
    name: "James Wilson",
    specialty: "New Construction",
    city: "Philadelphia",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    rating: 4.8,
    reviews: 112,
    experience: 9,
    phone: "(555) 678-9012",
    email: "james.wilson@realestate.com",
  },
  {
    id: "7",
    name: "Maria Garcia",
    specialty: "Residential Sales",
    city: "San Antonio",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    rating: 4.9,
    reviews: 143,
    experience: 11,
    phone: "(555) 789-0123",
    email: "maria.garcia@realestate.com",
  },
  {
    id: "8",
    name: "Robert Kim",
    specialty: "Commercial Real Estate",
    city: "San Diego",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
    rating: 4.7,
    reviews: 67,
    experience: 7,
    phone: "(555) 890-1234",
    email: "robert.kim@realestate.com",
  },
];

export default function AgentsSearchPage() {
  const [filters, setFilters] = useState({
    specialties: [] as string[],
    cities: [] as string[],
    searchName: "",
  });

  const filteredAgents = useMemo(() => {
    return AGENTS.filter(agent => {
      // Filter by name search
      if (filters.searchName && !agent.name.toLowerCase().includes(filters.searchName.toLowerCase())) {
        return false;
      }

      // Filter by specialties
      if (filters.specialties.length > 0) {
        const specialtyMap: Record<string, string> = {
          residential: "Residential Sales",
          commercial: "Commercial Real Estate",
          luxury: "Luxury Homes",
          investment: "Investment Properties",
          rental: "Rental Management",
          "new-construction": "New Construction",
        };

        const agentSpecialty = Object.entries(specialtyMap).find(([_, label]) => label === agent.specialty)?.[0];
        if (!agentSpecialty || !filters.specialties.includes(agentSpecialty)) {
          return false;
        }
      }

      // Filter by cities
      if (filters.cities.length > 0) {
        const cityMap: Record<string, string> = {
          "new-york": "New York",
          "los-angeles": "Los Angeles",
          chicago: "Chicago",
          houston: "Houston",
          phoenix: "Phoenix",
          philadelphia: "Philadelphia",
          "san-antonio": "San Antonio",
          "san-diego": "San Diego",
        };

        const agentCity = Object.entries(cityMap).find(([_, label]) => label === agent.city)?.[0];
        if (!agentCity || !filters.cities.includes(agentCity)) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Your Perfect Real Estate Agent
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Connect with top-rated real estate professionals in your area. Browse agents by specialty, location, and experience.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <AgentFilters onFiltersChange={setFilters} />
          </div>

          {/* Agents Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {filteredAgents.length} Agent{filteredAgents.length !== 1 ? 's' : ''} Found
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredAgents.length} of {AGENTS.length} agents
              </div>
            </div>

            {filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No agents found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}