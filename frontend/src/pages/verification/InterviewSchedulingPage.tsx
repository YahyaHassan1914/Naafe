import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Phone, MapPin, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import InterviewScheduler from '../../components/verification/InterviewScheduler';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  type: 'video' | 'phone' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

const InterviewSchedulingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [scheduledInterview, setScheduledInterview] = useState<InterviewSlot | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  // API hooks
  const { data: interviewData, loading: interviewLoading, refetch: refetchInterview } = useApi('/verification/interview');
  const { mutate: cancelInterview } = useApi('/verification/interview/cancel', 'POST');

  useEffect(() => {
    if (interviewData?.success) {
      setScheduledInterview(interviewData.data.interview || null);
    }
  }, [interviewData]);

  const handleScheduleInterview = (interviewData: any) => {
    setScheduledInterview({
      id: 'temp-id',
      date: interviewData.date,
      time: interviewData.time,
      type: interviewData.type,
      status: 'scheduled',
      notes: interviewData.notes
    });
    setIsScheduling(false);
    showSuccess('تم جدولة المقابلة بنجاح');
    refetchInterview();
  };

  const handleCancelInterview = async () => {
    if (!scheduledInterview) return;

    try {
      await cancelInterview({ interviewId: scheduledInterview.id });
      setScheduledInterview(null);
      showSuccess('تم إلغاء المقابلة بنجاح');
      refetchInterview();
    } catch (error) {
      showError('حدث خطأ في إلغاء المقابلة');
    }
  };

  const handleBack = () => {
    navigate('/verification');
  };

  const getInterviewTypeInfo = (type: string) => {
    switch (type) {
      case 'video':
        return {
          icon: Video,
          name: 'مقابلة فيديو',
          description: 'مقابلة عبر الفيديو باستخدام Zoom أو Google Meet',
          duration: '30 دقيقة'
        };
      case 'phone':
        return {
          icon: Phone,
          name: 'مقابلة هاتفية',
          description: 'مقابلة عبر الهاتف في الوقت المحدد',
          duration: '20 دقيقة'
        };
      case 'in-person':
        return {
          icon: MapPin,
          name: 'مقابلة شخصية',
          description: 'مقابلة في مكتبنا في القاهرة',
          duration: '45 دقيقة'
        };
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canCancel = () => {
    if (!scheduledInterview) return false;
    const interviewDate = new Date(`${scheduledInterview.date}T${scheduledInterview.time}`);
    const now = new Date();
    const hoursDiff = (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24; // Can cancel if more than 24 hours before
  };

  if (interviewLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">جدولة المقابلة</h1>
            <p className="text-gray-600">
              اختر موعداً مناسباً للمقابلة لتأكيد مهاراتك
            </p>
          </div>
        </div>

        {/* Scheduled Interview */}
        {scheduledInterview && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">المقابلة المجدولة</h2>
              <Badge variant="success">مجدولة</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">التاريخ</p>
                    <p className="font-medium text-gray-900">{formatDate(scheduledInterview.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">الوقت</p>
                    <p className="font-medium text-gray-900">الساعة {scheduledInterview.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getInterviewTypeInfo(scheduledInterview.type)?.icon && (
                    <getInterviewTypeInfo(scheduledInterview.type)!.icon className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500">نوع المقابلة</p>
                    <p className="font-medium text-gray-900">
                      {getInterviewTypeInfo(scheduledInterview.type)?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getInterviewTypeInfo(scheduledInterview.type)?.description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">تعليمات المقابلة</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• تأكد من تواجدك قبل 5 دقائق من الموعد</li>
                    <li>• احضر معك الهوية الوطنية</li>
                    <li>• للمقابلة عبر الفيديو، تأكد من جودة الاتصال</li>
                    <li>• للمقابلة الشخصية، احضر إلى العنوان المحدد</li>
                  </ul>
                </div>
                
                {scheduledInterview.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-900 mb-2">ملاحظات إضافية</h3>
                    <p className="text-sm text-yellow-800">{scheduledInterview.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {canCancel() ? (
                  <Button
                    variant="outline"
                    onClick={handleCancelInterview}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    إلغاء المقابلة
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">لا يمكن إلغاء المقابلة قبل 24 ساعة</span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => setIsScheduling(true)}
                variant="outline"
              >
                تغيير الموعد
              </Button>
            </div>
          </div>
        )}

        {/* Interview Scheduler */}
        {(!scheduledInterview || isScheduling) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {scheduledInterview ? 'تغيير موعد المقابلة' : 'جدولة مقابلة جديدة'}
              </h2>
              {scheduledInterview && (
                <Button
                  variant="ghost"
                  onClick={() => setIsScheduling(false)}
                >
                  إلغاء
                </Button>
              )}
            </div>
            
            <InterviewScheduler
              onSchedule={handleScheduleInterview}
              onComplete={() => setIsScheduling(false)}
            />
          </div>
        )}

        {/* Interview Types Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أنواع المقابلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900">مقابلة فيديو</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                مقابلة عبر الفيديو باستخدام Zoom أو Google Meet
              </p>
              <div className="text-xs text-gray-500">المدة: 30 دقيقة</div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900">مقابلة هاتفية</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                مقابلة عبر الهاتف في الوقت المحدد
              </p>
              <div className="text-xs text-gray-500">المدة: 20 دقيقة</div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900">مقابلة شخصية</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                مقابلة في مكتبنا في القاهرة
              </p>
              <div className="text-xs text-gray-500">المدة: 45 دقيقة</div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">ملاحظات مهمة</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• يمكنك إلغاء أو تغيير الموعد قبل 24 ساعة من المقابلة</li>
                <li>• في حالة عدم الحضور، سيتم إعادة جدولة المقابلة</li>
                <li>• المقابلة ضرورية لإكمال عملية التحقق</li>
                <li>• تأكد من توفرك في الوقت المحدد</li>
                <li>• يمكنك التواصل معنا في حالة وجود أي مشكلة</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            رجوع
          </Button>
          
          {scheduledInterview && !isScheduling && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">تم جدولة المقابلة بنجاح</span>
              </div>
              
              <Button
                onClick={() => navigate('/verification')}
              >
                إكمال التحقق
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InterviewSchedulingPage; 