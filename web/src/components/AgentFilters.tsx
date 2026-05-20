"use client";

import { useState } from "react";

interface AgentFiltersProps {
  specialties: string[];
  cities: string[];
  onFiltersChange: (filters: {
    specialties: string[];
    cities: string[];
    searchName: string;
  }) => void;
}

export default function AgentFilters({ specialties: specialtyOptions, cities: cityOptions, onFiltersChange }: AgentFiltersProps) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");

  const handleSpecialtyChange = (value: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedSpecialties, value]
      : selectedSpecialties.filter((s) => s !== value);
    setSelectedSpecialties(newSelected);
    onFiltersChange({ specialties: newSelected, cities: selectedCities, searchName });
  };

  const handleCityChange = (value: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedCities, value]
      : selectedCities.filter((c) => c !== value);
    setSelectedCities(newSelected);
    onFiltersChange({ specialties: selectedSpecialties, cities: newSelected, searchName });
  };

  const handleNameSearch = (value: string) => {
    setSearchName(value);
    onFiltersChange({ specialties: selectedSpecialties, cities: selectedCities, searchName: value });
  };

  const clearAllFilters = () => {
    setSelectedSpecialties([]);
    setSelectedCities([]);
    setSearchName("");
    onFiltersChange({ specialties: [], cities: [], searchName: "" });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6 sticky top-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
        {(selectedSpecialties.length > 0 || selectedCities.length > 0 || searchName) && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Name Search */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Search by Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchName}
            onChange={(e) => handleNameSearch(e.target.value)}
            placeholder="Enter agent name..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <svg
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Specialties */}
      {specialtyOptions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Specialty
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {specialtyOptions.map((specialty) => (
              <label
                key={specialty}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedSpecialties.includes(specialty)}
                    onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                    selectedSpecialties.includes(specialty)
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 dark:border-gray-600 group-hover:border-gray-400"
                  }`}>
                    {selectedSpecialties.includes(specialty) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{specialty}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Cities */}
      {cityOptions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            City
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cityOptions.map((city) => (
              <label
                key={city}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(city)}
                    onChange={(e) => handleCityChange(city, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${
                    selectedCities.includes(city)
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 dark:border-gray-600 group-hover:border-gray-400"
                  }`}>
                    {selectedCities.includes(city) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{city}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(selectedSpecialties.length > 0 || selectedCities.length > 0) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {selectedSpecialties.map((specialty) => (
              <span
                key={specialty}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
              >
                {specialty}
                <button
                  onClick={() => handleSpecialtyChange(specialty, false)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </span>
            ))}
            {selectedCities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
              >
                {city}
                <button
                  onClick={() => handleCityChange(city, false)}
                  className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
