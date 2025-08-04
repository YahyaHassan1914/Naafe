import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  component: React.ComponentType<any>;
}

interface VerificationWizardProps {
  onComplete?: (verificationData: any) => void;
  onCancel?: () => void;
  className?: string;
}

const VerificationWizard: React.FC<VerificationWizardProps> = ({
  onComplete,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // API hooks
  const { data: verificationStatus, refetch: refetchStatus } = useApi('/verification/status');
  const { mutate: updateVerification } = useApi('/verification/update', 'PUT');
  const { mutate: submitVerification } = useApi('/verification/submit', 'POST');

  // Mock steps - these would be replaced with actual step components
  const steps: VerificationStep[] = [
    {
      id: 'personal-info',
      title: 'المعلومات الشخصية',
      description: 'تأكيد هويتك الشخصية',
      isCompleted: false,
      isRequired: true,
      component: () => <div>Personal Info Component</div>
    },
    {
      id: 'documents',
      title: 'رفع المستندات',
      description: 'رفع الوثائق المطلوبة',
      isCompleted: false,
      isRequired: true,
      component: () => <div>Documents Component</div>
    },
    {
      id: 'experience',
      title: 'الخبرة والمؤهلات',
      description: 'إضافة خبراتك ومؤهلاتك',
      isCompleted: false,
      isRequired: true,
      component: () => <div>Experience Component</div>
    },
    {
      id: 'interview',
      title: 'جدولة المقابلة',
      description: 'اختيار موعد المقابلة',
      isCompleted: false,
      isRequired: true,
      component: () => <div>Interview Component</div>
    },
    {
      id: 'review',
      title: 'مراجعة الطلب',
      description: 'مراجعة جميع المعلومات',
      isCompleted: false,
      isRequired: true,
      component: () => <div>Review Component</div>
    }
  ];

  // Load verification status
  useEffect(() => {
    if (verificationStatus?.success) {
      const status = verificationStatus.data;
      setVerificationData(status.data || {});
      
      // Update step completion status
      const updatedSteps = steps.map(step => ({
        ...step,
        isCompleted: status.completedSteps?.includes(step.id) || false
      }));
      
      // Find the next incomplete step
      const nextIncompleteStep = updatedSteps.findIndex(step => !step.isCompleted);
      if (nextIncompleteStep !== -1) {
        setCurrentStep(nextIncompleteStep);
      }
    }
  }, [verificationStatus]);

  const handleStepComplete = (stepId: string, stepData: any) => {
    setVerificationData(prev => ({
      ...prev,
      [stepId]: stepData
    }));

    // Mark step as completed
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, isCompleted: true } : step
    );

    // Save step data
    updateVerification({
      stepId,
      data: stepData
    });

    // Move to next step
    const currentStepIndex = updatedSteps.findIndex(step => step.id === stepId);
    if (currentStepIndex < updatedSteps.length - 1) {
      setCurrentStep(currentStepIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await submitVerification(verificationData);
      showSuccess('تم إرسال طلب التحقق بنجاح');
      if (onComplete) {
        onComplete(verificationData);
      }
    } catch (error) {
      showError('حدث خطأ في إرسال طلب التحقق');
    } finally {
      setSaving(false);
    }
  };

  const getStepStatus = (step: VerificationStep, index: number) => {
    if (step.isCompleted) {
      return 'completed';
    } else if (index === currentStep) {
      return 'current';
    } else if (index < currentStep) {
      return 'visited';
    } else {
      return 'pending';
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.isCompleted).length;
    return (completedSteps / steps.length) * 100;
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    return currentStepData.isCompleted || currentStepData.id === 'review';
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">تحقق من الهوية</h2>
            <p className="text-sm text-gray-500">أكمل الخطوات التالية للتحقق من هويتك</p>
          </div>
          <Badge variant="info" className="text-sm">
            {Math.round(getProgressPercentage())}% مكتمل
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step, index);
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                      status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                      status === 'visited' ? 'bg-gray-300 border-gray-300 text-gray-600' :
                      'bg-white border-gray-300 text-gray-400'}
                  `}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${
                      status === 'current' ? 'text-blue-600' :
                      status === 'completed' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-4
                    ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                  `}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h3>
          <p className="text-sm text-gray-500">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Step Component */}
        <div className="mb-6">
          {/* This would render the actual step component */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              مكون {steps[currentStep].title} سيتم إضافته هنا
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                السابق
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={loading || saving}
              >
                إلغاء
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLastStep ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                loading={loading}
              >
                التالي
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                loading={saving}
              >
                إرسال طلب التحقق
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationWizard; 