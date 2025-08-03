import { api, ApiResponse } from './api';

// Types for verification data
export interface VerificationRequest {
  category: string;
  subcategory: string;
  experience: string;
  skills: string;
  portfolio?: string;
  references?: string;
}

export interface VerificationDocument {
  type: 'id_card' | 'portfolio' | 'references' | 'certificate' | 'other';
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
}

export interface UploadDocumentsData {
  documents: VerificationDocument[];
  documentType: string;
}

export interface InterviewSchedule {
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface VerificationStatus {
  verificationStatus: 'none' | 'basic' | 'skill' | 'approved';
  basicVerification: {
    isCompleted: boolean;
    completedAt?: string;
  };
  skillVerification: {
    isCompleted: boolean;
    completedAt?: string;
  };
  categorySpecific: {
    category: string;
    subcategory: string;
    experience: string;
    skills: string;
    portfolio: string;
    references: string;
    documents: VerificationDocument[];
    interviewScheduled: boolean;
    interviewDate?: string;
    interviewNotes: string;
    assessment: string;
    recommendation: string;
    adminNotes: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  canProceed: boolean;
}

// Verification service functions
export const verificationService = {
  /**
   * Request provider verification
   */
  async requestVerification(data: VerificationRequest): Promise<ApiResponse<any>> {
    return api.verification.request(data);
  },

  /**
   * Upload verification documents
   */
  async uploadDocuments(data: UploadDocumentsData): Promise<ApiResponse<any>> {
    return api.verification.uploadDocuments(data);
  },

  /**
   * Get verification status
   */
  async getVerificationStatus(): Promise<ApiResponse<VerificationStatus>> {
    return api.verification.getStatus();
  },

  /**
   * Schedule verification interview
   */
  async scheduleInterview(data: InterviewSchedule): Promise<ApiResponse<any>> {
    return api.verification.scheduleInterview(data);
  },

  /**
   * Upload a single document
   */
  async uploadDocument(
    file: File, 
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<VerificationDocument> {
    try {
      const response = await api.users.uploadAvatar(file, onProgress);
      if (response.success && response.data) {
        return {
          type: documentType as VerificationDocument['type'],
          url: response.data.avatarUrl,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size
        };
      }
      throw new Error('Failed to upload document');
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(
    files: File[],
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<VerificationDocument[]> {
    const documents: VerificationDocument[] = [];
    
    for (const file of files) {
      try {
        const document = await this.uploadDocument(file, documentType, onProgress);
        documents.push(document);
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
    
    return documents;
  },

  /**
   * Get verification steps for the current user
   */
  async getVerificationSteps(): Promise<VerificationStep[]> {
    try {
      const statusResponse = await this.getVerificationStatus();
      
      if (!statusResponse.success || !statusResponse.data) {
        throw new Error('Failed to get verification status');
      }

      const status = statusResponse.data;
      const steps: VerificationStep[] = [];

      // Step 1: Basic Information
      steps.push({
        id: 'basic-info',
        title: 'المعلومات الأساسية',
        description: 'إدخال الفئة والمهارات والخبرة',
        isCompleted: status.verificationStatus !== 'none',
        isRequired: true,
        canProceed: true
      });

      // Step 2: Document Upload
      steps.push({
        id: 'documents',
        title: 'رفع المستندات',
        description: 'رفع بطاقة الهوية والمستندات الداعمة',
        isCompleted: status.categorySpecific.documents.length > 0,
        isRequired: true,
        canProceed: status.verificationStatus !== 'none'
      });

      // Step 3: Interview Scheduling
      steps.push({
        id: 'interview',
        title: 'جدولة المقابلة',
        description: 'جدولة مقابلة التحقق من المهارات',
        isCompleted: status.categorySpecific.interviewScheduled,
        isRequired: true,
        canProceed: status.categorySpecific.documents.length > 0
      });

      // Step 4: Review
      steps.push({
        id: 'review',
        title: 'مراجعة الطلب',
        description: 'مراجعة الطلب من قبل الإدارة',
        isCompleted: status.verificationStatus === 'approved',
        isRequired: true,
        canProceed: status.categorySpecific.interviewScheduled
      });

      return steps;
    } catch (error) {
      console.error('Error getting verification steps:', error);
      return [];
    }
  },

  /**
   * Get current verification step
   */
  async getCurrentStep(): Promise<VerificationStep | null> {
    const steps = await this.getVerificationSteps();
    return steps.find(step => !step.isCompleted) || null;
  },

  /**
   * Get verification progress percentage
   */
  async getVerificationProgress(): Promise<number> {
    const steps = await this.getVerificationSteps();
    const completedSteps = steps.filter(step => step.isCompleted).length;
    return Math.round((completedSteps / steps.length) * 100);
  },

  /**
   * Check if user can proceed to next step
   */
  async canProceedToNextStep(): Promise<boolean> {
    const currentStep = await this.getCurrentStep();
    return currentStep?.canProceed || false;
  },

  /**
   * Get document type display name
   */
  getDocumentTypeName(type: VerificationDocument['type']): string {
    const typeNames: Record<VerificationDocument['type'], string> = {
      id_card: 'بطاقة الهوية',
      portfolio: 'معرض الأعمال',
      references: 'المراجع',
      certificate: 'الشهادات',
      other: 'مستندات أخرى'
    };
    return typeNames[type] || type;
  },

  /**
   * Get verification status display name
   */
  getVerificationStatusName(status: VerificationStatus['verificationStatus']): string {
    const statusNames: Record<VerificationStatus['verificationStatus'], string> = {
      none: 'غير محقق',
      basic: 'تحقق أساسي',
      skill: 'تحقق المهارات',
      approved: 'محقق ومعتمد'
    };
    return statusNames[status] || status;
  },

  /**
   * Get verification status color for UI
   */
  getVerificationStatusColor(status: VerificationStatus['verificationStatus']): string {
    const statusColors: Record<VerificationStatus['verificationStatus'], string> = {
      none: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      skill: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Get category specific status display name
   */
  getCategorySpecificStatusName(status: VerificationStatus['categorySpecific']['status']): string {
    const statusNames: Record<VerificationStatus['categorySpecific']['status'], string> = {
      pending: 'قيد المراجعة',
      approved: 'معتمد',
      rejected: 'مرفوض'
    };
    return statusNames[status] || status;
  },

  /**
   * Get category specific status color for UI
   */
  getCategorySpecificStatusColor(status: VerificationStatus['categorySpecific']['status']): string {
    const statusColors: Record<VerificationStatus['categorySpecific']['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Validate document file
   */
  validateDocumentFile(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      errors.push('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, GIF, PDF, DOC, DOCX');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get interview time slots
   */
  getInterviewTimeSlots(): Array<{
    value: string;
    label: string;
  }> {
    return [
      { value: '09:00', label: '9:00 صباحاً' },
      { value: '10:00', label: '10:00 صباحاً' },
      { value: '11:00', label: '11:00 صباحاً' },
      { value: '12:00', label: '12:00 ظهراً' },
      { value: '13:00', label: '1:00 ظهراً' },
      { value: '14:00', label: '2:00 ظهراً' },
      { value: '15:00', label: '3:00 عصراً' },
      { value: '16:00', label: '4:00 عصراً' },
      { value: '17:00', label: '5:00 عصراً' },
      { value: '18:00', label: '6:00 مساءً' }
    ];
  },

  /**
   * Get available interview dates (next 7 days)
   */
  getAvailableInterviewDates(): Array<{
    value: string;
    label: string;
  }> {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (Friday and Saturday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // 5 = Friday, 6 = Saturday
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    }
    
    return dates;
  },

  /**
   * Check if verification is complete
   */
  async isVerificationComplete(): Promise<boolean> {
    try {
      const statusResponse = await this.getVerificationStatus();
      return statusResponse.success && statusResponse.data?.verificationStatus === 'approved';
    } catch (error) {
      console.error('Error checking verification completion:', error);
      return false;
    }
  },

  /**
   * Get verification requirements for a category
   */
  getVerificationRequirements(category: string): {
    requiredDocuments: string[];
    skillsAssessment: boolean;
    interviewRequired: boolean;
    estimatedTime: string;
  } {
    const requirements: Record<string, {
      requiredDocuments: string[];
      skillsAssessment: boolean;
      interviewRequired: boolean;
      estimatedTime: string;
    }> = {
      'plumbing': {
        requiredDocuments: ['بطاقة الهوية', 'صور من الأعمال السابقة', 'مراجع'],
        skillsAssessment: true,
        interviewRequired: true,
        estimatedTime: '3-5 أيام عمل'
      },
      'electrical': {
        requiredDocuments: ['بطاقة الهوية', 'صور من الأعمال السابقة', 'مراجع'],
        skillsAssessment: true,
        interviewRequired: true,
        estimatedTime: '3-5 أيام عمل'
      },
      'cleaning': {
        requiredDocuments: ['بطاقة الهوية', 'مراجع'],
        skillsAssessment: false,
        interviewRequired: true,
        estimatedTime: '2-3 أيام عمل'
      },
      'painting': {
        requiredDocuments: ['بطاقة الهوية', 'صور من الأعمال السابقة', 'مراجع'],
        skillsAssessment: true,
        interviewRequired: true,
        estimatedTime: '3-5 أيام عمل'
      }
    };

    return requirements[category] || {
      requiredDocuments: ['بطاقة الهوية', 'مراجع'],
      skillsAssessment: true,
      interviewRequired: true,
      estimatedTime: '3-5 أيام عمل'
    };
  },
};

export default verificationService; 