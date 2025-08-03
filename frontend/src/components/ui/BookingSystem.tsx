import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, Phone } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';
import SmartCalendar from './SmartCalendar';
import Modal from '../../admin/components/UI/Modal';

interface BookingSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'pending' | 'completed';
  jobId?: string;
  clientName?: string;
  jobTitle?: string;
  clientPhone?: string;
  notes?: string;
}

interface Provider {
  id: string;
  name: string;
  avatar?: string;
  category: string;
  rating: number;
  isVerified: boolean;
  phone?: string;
}

interface BookingSystemProps {
  provider: Provider;
  onBookingConfirm?: (booking: BookingSlot) => void;
  onBookingCancel?: (bookingId: string) => void;
  mode?: 'seeker' | 'provider';
  className?: string;
}

const BookingSystem: React.FC<BookingSystemProps> = ({
  provider,
  onBookingConfirm,
  onBookingCancel,
  mode = 'seeker',
  className
}) => {
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BookingSlot | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle time slot selection from calendar
  const handleTimeSlotSelect = (date: string, timeSlot: any) => {
    if (mode === 'seeker' && timeSlot.status === 'available') {
      setSelectedSlot({
        id: timeSlot.id,
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: 'pending'
      });
      setShowBookingModal(true);
    }
  };

  // Handle job click from calendar
  const handleJobClick = (jobId: string) => {
    // In a real app, this would fetch job details from API
    const mockJob: BookingSlot = {
      id: jobId,
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '12:00',
      status: 'booked',
      jobId,
      clientName: 'أحمد محمد',
      jobTitle: 'إصلاح سباكة',
      clientPhone: '0123456789',
      notes: 'مشكلة في الحمام الرئيسي - تسريب مياه'
    };
    
    setSelectedJob(mockJob);
    setShowJobDetailsModal(true);
  };

  // Handle booking confirmation
  const handleBookingConfirm = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      // In a real app, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const confirmedBooking: BookingSlot = {
        ...selectedSlot,
        status: 'booked',
        jobId: `job-${Date.now()}`,
        clientName: 'أنت',
        jobTitle: 'حجز موعد'
      };

      onBookingConfirm?.(confirmedBooking);
      setShowBookingModal(false);
      setSelectedSlot(null);
      
      // Show success message
      // You could use a toast notification here
    } catch (error) {
      console.error('Error confirming booking:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation
  const handleBookingCancel = async (bookingId: string) => {
    setLoading(true);
    try {
      // In a real app, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onBookingCancel?.(bookingId);
      setShowJobDetailsModal(false);
      setSelectedJob(null);
      
      // Show success message
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Provider Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <img
            src={provider.avatar || '/default-avatar.png'}
            alt={provider.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-800">{provider.name}</h3>
              {provider.isVerified && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{provider.category}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span>{provider.rating.toFixed(1)}</span>
              </div>
              {provider.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{provider.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Calendar */}
      <SmartCalendar
        providerId={provider.id}
        onTimeSlotSelect={handleTimeSlotSelect}
        onJobClick={handleJobClick}
        mode={mode}
      />

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="تأكيد الحجز"
      >
        {selectedSlot && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">تفاصيل الموعد</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">التاريخ:</span>
                  <span className="font-medium">
                    {new Date(selectedSlot.date).toLocaleDateString('ar-EG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الوقت:</span>
                  <span className="font-medium">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المحترف:</span>
                  <span className="font-medium">{provider.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">معلومات مهمة:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• سيتم التواصل معك لتأكيد الموعد</li>
                    <li>• يمكنك إلغاء الحجز قبل 24 ساعة</li>
                    <li>• تأكد من توفرك في الوقت المحدد</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBookingModal(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleBookingConfirm}
                loading={loading}
                className="flex-1"
              >
                تأكيد الحجز
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Job Details Modal */}
      <Modal
        isOpen={showJobDetailsModal}
        onClose={() => setShowJobDetailsModal(false)}
        title="تفاصيل المهمة"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">معلومات العميل</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">الاسم:</span>
                  <span className="font-medium">{selectedJob.clientName}</span>
                </div>
                {selectedJob.clientPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">الهاتف:</span>
                    <span className="font-medium">{selectedJob.clientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">نوع العمل:</span>
                  <span className="font-medium">{selectedJob.jobTitle}</span>
                </div>
              </div>
            </div>

            {selectedJob.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">ملاحظات العميل</h4>
                <p className="text-sm text-gray-700">{selectedJob.notes}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">التوقيت:</p>
                  <p>
                    {new Date(selectedJob.date).toLocaleDateString('ar-EG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p>{selectedJob.startTime} - {selectedJob.endTime}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowJobDetailsModal(false)}
                className="flex-1"
              >
                إغلاق
              </Button>
              {mode === 'provider' && (
                <Button
                  variant="outline"
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                  className="flex-1"
                >
                  تواصل
                </Button>
              )}
              {mode === 'provider' && (
                <Button
                  variant="primary"
                  onClick={() => handleBookingCancel(selectedJob.id)}
                  loading={loading}
                  className="flex-1"
                >
                  إلغاء الحجز
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingSystem; 