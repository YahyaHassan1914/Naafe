import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';

interface Provider {
  _id: string;
  name: { first: string; last: string };
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  isTopRated: boolean;
  responseTime: number; // in minutes
  skills: Array<{
    category: string;
    subcategory: string;
    verified: boolean;
    yearsOfExperience: number;
  }>;
  location: {
    governorate: string;
    city: string;
  };
  pricingRange: {
    min: number;
    max: number;
  };
  availability: {
    isAvailable: boolean;
    availableDays: string[];
    availableHours: {
      start: string;
      end: string;
    };
  };
  verificationLevel: 'basic' | 'skill' | 'approved';
  lastActive: Date;
  completionRate: number;
  averageResponseTime: number;
}

interface ServiceRequest {
  _id: string;
  category: string;
  subcategory: string;
  urgency: 'asap' | 'this-week' | 'flexible';
  location: {
    governorate: string;
    city: string;
  };
  description: string;
  budget?: {
    min: number;
    max: number;
  };
  createdAt: Date;
  expiresAt: Date;
}

interface MatchingCriteria {
  locationWeight: number;
  skillsWeight: number;
  ratingWeight: number;
  availabilityWeight: number;
  responseTimeWeight: number;
  verificationWeight: number;
  completionRateWeight: number;
}

interface MatchingResult {
  provider: Provider;
  score: number;
  matchReasons: string[];
  distanceScore: number;
  skillsScore: number;
  ratingScore: number;
  availabilityScore: number;
  responseTimeScore: number;
  verificationScore: number;
  completionRateScore: number;
}

interface SmartMatchingEngineProps {
  request: ServiceRequest;
  maxResults?: number;
  customCriteria?: Partial<MatchingCriteria>;
  onResultsReady?: (results: MatchingResult[]) => void;
  className?: string;
}

const DEFAULT_CRITERIA: MatchingCriteria = {
  locationWeight: 0.25,      // 25% - Location proximity
  skillsWeight: 0.20,         // 20% - Skill match
  ratingWeight: 0.15,         // 15% - Rating and reviews
  availabilityWeight: 0.15,   // 15% - Current availability
  responseTimeWeight: 0.10,   // 10% - Response time
  verificationWeight: 0.10,   // 10% - Verification level
  completionRateWeight: 0.05  // 5% - Completion rate
};

const SmartMatchingEngine: React.FC<SmartMatchingEngineProps> = ({
  request,
  maxResults = 10,
  customCriteria = {},
  onResultsReady,
  className = ''
}) => {
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Fetch all providers
  const { data: allProviders, isLoading: providersLoading } = useApi('/providers');
  
  // Combine default and custom criteria
  const criteria = useMemo(() => ({
    ...DEFAULT_CRITERIA,
    ...customCriteria
  }), [customCriteria]);

  // Calculate distance between two locations (simplified - in real app, use actual coordinates)
  const calculateDistanceScore = (providerLocation: any, requestLocation: any): number => {
    // Same city = 1.0, same governorate = 0.8, different governorate = 0.3
    if (providerLocation.city === requestLocation.city) {
      return 1.0;
    } else if (providerLocation.governorate === requestLocation.governorate) {
      return 0.8;
    } else {
      return 0.3;
    }
  };

  // Calculate skills match score
  const calculateSkillsScore = (providerSkills: any[], requestCategory: string, requestSubcategory: string): number => {
    const matchingSkills = providerSkills.filter(skill => 
      skill.category === requestCategory && skill.subcategory === requestSubcategory
    );

    if (matchingSkills.length === 0) {
      return 0;
    }

    // Calculate score based on verification and experience
    const verifiedSkills = matchingSkills.filter(skill => skill.verified);
    const totalExperience = matchingSkills.reduce((sum, skill) => sum + skill.yearsOfExperience, 0);
    
    let score = 0.5; // Base score for having the skill
    
    // Bonus for verified skills
    if (verifiedSkills.length > 0) {
      score += 0.3;
    }
    
    // Bonus for experience (max 0.2 bonus for 10+ years)
    const experienceBonus = Math.min(totalExperience / 10, 1) * 0.2;
    score += experienceBonus;
    
    return Math.min(score, 1.0);
  };

  // Calculate rating score
  const calculateRatingScore = (rating: number, reviewCount: number): number => {
    // Base score from rating (0-5 scale)
    let score = rating / 5;
    
    // Bonus for having more reviews (trust factor)
    const reviewBonus = Math.min(reviewCount / 50, 1) * 0.1; // Max 0.1 bonus for 50+ reviews
    score += reviewBonus;
    
    return Math.min(score, 1.0);
  };

  // Calculate availability score
  const calculateAvailabilityScore = (availability: any, urgency: string): number => {
    if (!availability.isAvailable) {
      return 0;
    }

    let score = 0.5; // Base score for being available
    
    // Bonus for immediate availability for urgent requests
    if (urgency === 'asap' && availability.isAvailable) {
      score += 0.3;
    }
    
    // Bonus for flexible availability
    if (availability.availableDays.length >= 5) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  };

  // Calculate response time score
  const calculateResponseTimeScore = (averageResponseTime: number): number => {
    // Convert minutes to hours
    const responseHours = averageResponseTime / 60;
    
    // Perfect score for < 1 hour, decreasing score for longer times
    if (responseHours <= 1) {
      return 1.0;
    } else if (responseHours <= 4) {
      return 0.8;
    } else if (responseHours <= 24) {
      return 0.6;
    } else {
      return 0.3;
    }
  };

  // Calculate verification score
  const calculateVerificationScore = (verificationLevel: string, isTopRated: boolean): number => {
    let score = 0;
    
    switch (verificationLevel) {
      case 'approved':
        score = 1.0;
        break;
      case 'skill':
        score = 0.7;
        break;
      case 'basic':
        score = 0.4;
        break;
      default:
        score = 0.2;
    }
    
    // Bonus for top-rated providers
    if (isTopRated) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  };

  // Calculate completion rate score
  const calculateCompletionRateScore = (completionRate: number): number => {
    return completionRate / 100; // Convert percentage to 0-1 scale
  };

  // Generate match reasons
  const generateMatchReasons = (result: Omit<MatchingResult, 'provider'>): string[] => {
    const reasons: string[] = [];
    
    if (result.distanceScore >= 0.8) {
      reasons.push('قريب من موقعك');
    }
    
    if (result.skillsScore >= 0.8) {
      reasons.push('متخصص في هذا النوع من الخدمات');
    }
    
    if (result.ratingScore >= 0.8) {
      reasons.push('تقييم عالي');
    }
    
    if (result.availabilityScore >= 0.8) {
      reasons.push('متاح فوراً');
    }
    
    if (result.responseTimeScore >= 0.8) {
      reasons.push('استجابة سريعة');
    }
    
    if (result.verificationScore >= 0.8) {
      reasons.push('محقق ومصدق عليه');
    }
    
    if (result.completionRateScore >= 0.9) {
      reasons.push('معدل إنجاز عالي');
    }
    
    return reasons.slice(0, 3); // Return top 3 reasons
  };

  // Main matching algorithm
  const performMatching = useMemo(() => {
    if (!allProviders || !request) {
      return [];
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const results: MatchingResult[] = [];
    const totalProviders = allProviders.length;

    allProviders.forEach((provider: Provider, index: number) => {
      // Update progress
      setProcessingProgress((index / totalProviders) * 100);

      // Calculate individual scores
      const distanceScore = calculateDistanceScore(provider.location, request.location);
      const skillsScore = calculateSkillsScore(provider.skills, request.category, request.subcategory);
      const ratingScore = calculateRatingScore(provider.rating, provider.reviewCount);
      const availabilityScore = calculateAvailabilityScore(provider.availability, request.urgency);
      const responseTimeScore = calculateResponseTimeScore(provider.averageResponseTime);
      const verificationScore = calculateVerificationScore(provider.verificationLevel, provider.isTopRated);
      const completionRateScore = calculateCompletionRateScore(provider.completionRate);

      // Calculate weighted total score
      const totalScore = 
        distanceScore * criteria.locationWeight +
        skillsScore * criteria.skillsWeight +
        ratingScore * criteria.ratingWeight +
        availabilityScore * criteria.availabilityWeight +
        responseTimeScore * criteria.responseTimeWeight +
        verificationScore * criteria.verificationWeight +
        completionRateScore * criteria.completionRateWeight;

      // Only include providers with minimum score threshold
      if (totalScore >= 0.3) {
        const result: MatchingResult = {
          provider,
          score: totalScore,
          distanceScore,
          skillsScore,
          ratingScore,
          availabilityScore,
          responseTimeScore,
          verificationScore,
          completionRateScore,
          matchReasons: []
        };

        // Generate match reasons
        result.matchReasons = generateMatchReasons(result);
        
        results.push(result);
      }
    });

    // Sort by score (highest first) and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    setMatchingResults(sortedResults);
    setIsProcessing(false);
    setProcessingProgress(100);

    // Notify parent component
    if (onResultsReady) {
      onResultsReady(sortedResults);
    }

    return sortedResults;
  }, [allProviders, request, criteria, maxResults, onResultsReady]);

  // Auto-trigger matching when data is available
  useEffect(() => {
    if (allProviders && request && !isProcessing) {
      performMatching;
    }
  }, [allProviders, request, performMatching, isProcessing]);

  if (providersLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل المحترفين...</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-2"></div>
          <p className="text-gray-600">جاري البحث عن أفضل المحترفين...</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-deep-teal h-2 rounded-full transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{Math.round(processingProgress)}%</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Matching results are handled by parent components */}
      {/* This component focuses on the matching logic */}
    </div>
  );
};

export default SmartMatchingEngine; 