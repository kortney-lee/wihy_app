import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Award, Users, Calendar, MessageSquare, Filter, ChevronRight, Shield, CheckCircle } from 'lucide-react';
import { useRelationships } from '../contexts/RelationshipContext';
import Header from '../components/shared/Header';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';

interface Coach {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  location: string;
  experience: string;
  rating: number;
  reviewCount: number;
  profileImage?: string;
  bio: string;
  certifications: string[];
  pricing: {
    consultation: number;
    monthlyPlan: number;
  };
  availability: string[];
  responseTime: string;
  verified: boolean;
  clientCount: number;
}

const mockCoaches: Coach[] = [
  {
    id: 'coach-1',
    name: 'Dr. Sarah Johnson',
    title: 'Certified Nutritionist & Fitness Coach',
    specialties: ['Weight Loss', 'Sports Nutrition', 'Meal Planning'],
    location: 'Los Angeles, CA',
    experience: '8 years',
    rating: 4.9,
    reviewCount: 127,
    bio: 'Specializing in sustainable weight loss and performance nutrition. I help clients develop healthy relationships with food while achieving their fitness goals.',
    certifications: ['RD', 'ACSM-CPT', 'NASM-CNC'],
    pricing: {
      consultation: 85,
      monthlyPlan: 299
    },
    availability: ['Mon-Fri 9AM-6PM', 'Weekend mornings'],
    responseTime: 'Within 2 hours',
    verified: true,
    clientCount: 45
  },
  {
    id: 'coach-2',
    name: 'Michael Chen',
    title: 'Strength & Conditioning Specialist',
    specialties: ['Strength Training', 'Athletic Performance', 'Injury Prevention'],
    location: 'Seattle, WA',
    experience: '12 years',
    rating: 4.8,
    reviewCount: 89,
    bio: 'Former Olympic athlete turned coach. I focus on building functional strength and helping athletes reach peak performance.',
    certifications: ['CSCS', 'USAW', 'FMS'],
    pricing: {
      consultation: 75,
      monthlyPlan: 399
    },
    availability: ['Mon-Sat 6AM-8PM'],
    responseTime: 'Within 4 hours',
    verified: true,
    clientCount: 32
  },
  {
    id: 'coach-3',
    name: 'Amanda Rodriguez',
    title: 'Holistic Wellness Coach',
    specialties: ['Mindful Eating', 'Stress Management', 'Lifestyle Coaching'],
    location: 'Austin, TX',
    experience: '6 years',
    rating: 4.7,
    reviewCount: 156,
    bio: 'I believe in treating the whole person. My approach combines nutrition, fitness, and mental wellness for lasting change.',
    certifications: ['NBC-HWC', 'RYT-200', 'Precision Nutrition'],
    pricing: {
      consultation: 65,
      monthlyPlan: 249
    },
    availability: ['Tue-Sat 10AM-7PM'],
    responseTime: 'Within 6 hours',
    verified: true,
    clientCount: 67
  },
  {
    id: 'coach-4',
    name: 'James Thompson',
    title: 'Body Transformation Specialist',
    specialties: ['Weight Loss', 'Muscle Building', 'Body Recomposition'],
    location: 'Miami, FL',
    experience: '10 years',
    rating: 4.9,
    reviewCount: 203,
    bio: 'Helping busy professionals transform their bodies through efficient workouts and flexible nutrition strategies.',
    certifications: ['NASM-CPT', 'PN1', 'IFBB Pro'],
    pricing: {
      consultation: 95,
      monthlyPlan: 449
    },
    availability: ['Mon-Fri 5AM-9PM'],
    responseTime: 'Within 1 hour',
    verified: true,
    clientCount: 28
  }
];

const CoachSelectionPage: React.FC = () => {
  // Mock functions for missing context properties
  const requestCoach = (coachId: string) => console.log('Request coach:', coachId);
  const myCoach = null;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'budget' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Window width detection for responsive padding
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get all unique specialties
  const allSpecialties = Array.from(new Set(mockCoaches.flatMap(coach => coach.specialties)));

  // Filter and sort coaches
  const filteredCoaches = mockCoaches
    .filter(coach => {
      const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          coach.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSpecialty = !selectedSpecialty || coach.specialties.includes(selectedSpecialty);
      const matchesPrice = priceRange === 'all' || 
                          (priceRange === 'budget' && coach.pricing.monthlyPlan <= 300) ||
                          (priceRange === 'premium' && coach.pricing.monthlyPlan > 300);
      return matchesSearch && matchesSpecialty && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.pricing.monthlyPlan - b.pricing.monthlyPlan;
        case 'experience':
          return parseInt(b.experience) - parseInt(a.experience);
        default:
          return 0;
      }
    });

  const handleRequestCoach = () => {
    if (selectedCoach) {
      requestCoach(selectedCoach.id);
      setShowRequestModal(false);
      setSelectedCoach(null);
      setRequestMessage('');
      // TODO: Show success toast
    }
  };

  const renderCoachCard = (coach: Coach) => (
    <div key={coach.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {coach.name.charAt(0)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 flex items-center space-x-2">
                <span>{coach.name}</span>
                {coach.verified && <Shield size={16} className="text-blue-500" />}
              </h3>
              <p className="text-sm text-gray-600">{coach.title}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Star size={16} className="text-yellow-500 fill-current" />
                <span className="font-medium">{coach.rating}</span>
                <span className="text-sm text-gray-500">({coach.reviewCount})</span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin size={14} />
              <span>{coach.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award size={14} />
              <span>{coach.experience} experience</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users size={14} />
              <span>{coach.clientCount} clients</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{coach.bio}</p>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Specialties</h4>
        <div className="flex flex-wrap gap-2">
          {coach.specialties.map((specialty) => (
            <span key={specialty} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {specialty}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Certifications</h4>
        <div className="flex flex-wrap gap-2">
          {coach.certifications.map((cert) => (
            <span key={cert} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded border border-green-200">
              {cert}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500">Consultation</p>
          <p className="font-semibold text-gray-800">${coach.pricing.consultation}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Monthly Plan</p>
          <p className="font-semibold text-gray-800">${coach.pricing.monthlyPlan}/mo</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <Calendar size={14} />
          <span>Response: {coach.responseTime}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => {
            setSelectedCoach(coach);
            setShowRequestModal(true);
          }}
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
        >
          Request Coach
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          <MessageSquare size={16} />
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );

  if (myCoach) {
    return (
      <>
        {/* Fixed Header */}
        <div className={`fixed top-0 left-0 right-0 z-50 bg-white ${PlatformDetectionService.isNative() ? 'pt-12' : ''}`}>
          <Header
            variant="results"
            showLogin={true}
            showSearchInput={true}
            onSearchSubmit={() => {}}
            onChatMessage={() => {}}
            isInChatMode={false}
            showProgressMenu={true}
            onProgressMenuClick={undefined}
          />
        </div>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ paddingTop: windowWidth < 768 ? '320px' : windowWidth < 1200 ? '300px' : '180px' }}>
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">You already have a coach!</h2>
          <p className="text-gray-600 mb-4">You're currently working with {myCoach.name}.</p>
          <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
            Go to Dashboard
          </button>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Fixed Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white ${PlatformDetectionService.isNative() ? 'pt-12' : ''}`}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={() => {}}
          onChatMessage={() => {}}
          isInChatMode={false}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      </div>

      <div className="min-h-screen bg-gray-50" style={{ paddingTop: windowWidth < 768 ? '320px' : windowWidth < 1200 ? '300px' : '180px' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Find Your Perfect Coach</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with certified wellness professionals who can help you achieve your health and fitness goals
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search coaches or specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Specialties</option>
              {allSpecialties.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Prices</option>
              <option value="budget">Budget ($0-300)</option>
              <option value="premium">Premium ($300+)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="price">Sort by Price</option>
              <option value="experience">Sort by Experience</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {filteredCoaches.length} coach{filteredCoaches.length !== 1 ? 'es' : ''} found
          </p>
        </div>

        {/* Coach Grid */}
        {filteredCoaches.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No coaches found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCoaches.map(renderCoachCard)}
          </div>
        )}

        {/* Request Coach Modal */}
        {showRequestModal && selectedCoach && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Request {selectedCoach.name} as Your Coach
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedCoach.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{selectedCoach.name}</h4>
                    <p className="text-sm text-gray-600">{selectedCoach.title}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Introduce yourself and your goals (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Tell your coach about your fitness goals, experience level, and what you're hoping to achieve..."
                />
              </div>

              <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong> Your request will be sent to {selectedCoach.name}. 
                  They typically respond {selectedCoach.responseTime.toLowerCase()}. 
                  You'll receive a notification when they accept or if they have questions.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedCoach(null);
                    setRequestMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestCoach}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default CoachSelectionPage;