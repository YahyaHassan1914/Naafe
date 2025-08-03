import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Edit } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'pending' | 'completed';
  jobId?: string;
  clientName?: string;
  jobTitle?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

interface SmartCalendarProps {
  providerId?: string;
  onTimeSlotSelect?: (date: string, timeSlot: TimeSlot) => void;
  onJobClick?: (jobId: string) => void;
  mode?: 'provider' | 'seeker';
  className?: string;
}

const SmartCalendar: React.FC<SmartCalendarProps> = ({
  providerId,
  onTimeSlotSelect,
  onJobClick,
  mode = 'seeker',
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days: DaySchedule[] = [];

    // Add previous month's days to fill first week
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
        isAvailable: false,
        timeSlots: []
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date();
      
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
        isAvailable: !isPast && (date.getDay() !== 5), // Not Friday and not past
        timeSlots: generateDefaultTimeSlots(date.toISOString().split('T')[0])
      });
    }

    return days;
  };

  // Generate default time slots for a day
  const generateDefaultTimeSlots = (date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const slotDuration = 2; // 2 hours per slot

    for (let hour = startHour; hour < endHour; hour += slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00`;
      
      slots.push({
        id: `${date}-${startTime}`,
        startTime,
        endTime,
        status: 'available'
      });
    }

    return slots;
  };

  // Load schedule data
  useEffect(() => {
    loadSchedule();
  }, [currentMonth, providerId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from API
      const days = generateCalendarDays();
      
      // Simulate some booked slots
      if (mode === 'provider') {
        // Add some mock jobs for providers
        days.forEach(day => {
          if (day.isAvailable && Math.random() > 0.7) {
            const randomSlot = day.timeSlots[Math.floor(Math.random() * day.timeSlots.length)];
            if (randomSlot) {
              randomSlot.status = 'booked';
              randomSlot.jobId = `job-${Math.random().toString(36).substr(2, 9)}`;
              randomSlot.clientName = 'أحمد محمد';
              randomSlot.jobTitle = 'إصلاح سباكة';
            }
          }
        });
      }
      
      setSchedule(days);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Handle time slot selection
  const handleTimeSlotClick = (date: string, timeSlot: TimeSlot) => {
    if (timeSlot.status === 'available' && onTimeSlotSelect) {
      onTimeSlotSelect(date, timeSlot);
    } else if (timeSlot.status === 'booked' && onJobClick && timeSlot.jobId) {
      onJobClick(timeSlot.jobId);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'booked': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'booked': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
          >
            التالي
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Day headers */}
        {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {schedule.map((day, index) => (
          <div
            key={day.date}
            className={cn(
              'p-2 border border-gray-200 min-h-[80px] cursor-pointer transition-colors',
              !day.isAvailable && 'bg-gray-50 text-gray-400',
              selectedDate === day.date && 'border-deep-teal bg-deep-teal/10',
              day.isAvailable && 'hover:bg-gray-50'
            )}
            onClick={() => day.isAvailable && handleDateSelect(day.date)}
          >
            <div className="text-sm font-medium mb-1">
              {new Date(day.date).getDate()}
            </div>
            
            {/* Show job count for providers */}
            {mode === 'provider' && day.isAvailable && (
              <div className="text-xs text-gray-500">
                {day.timeSlots.filter(slot => slot.status === 'booked').length} مهمة
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Day Schedule */}
      {selectedDate && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">
            جدول {new Date(selectedDate).toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto"></div>
              <p className="text-gray-600 mt-2">جاري التحميل...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schedule
                .find(day => day.date === selectedDate)
                ?.timeSlots.map(timeSlot => (
                  <div
                    key={timeSlot.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      getStatusColor(timeSlot.status),
                      timeSlot.status === 'available' && 'hover:bg-green-200'
                    )}
                    onClick={() => handleTimeSlotClick(selectedDate, timeSlot)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(timeSlot.status)}
                        <span className="font-medium">
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </span>
                      </div>
                      
                      {timeSlot.status === 'booked' && (
                        <div className="text-xs">
                          <div className="font-medium">{timeSlot.clientName}</div>
                          <div>{timeSlot.jobTitle}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Quick Actions for Providers */}
          {mode === 'provider' && selectedDate && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                إضافة موعد
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-4 h-4" />}
              >
                تعديل الجدول
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h5 className="text-sm font-medium text-gray-700 mb-2">دليل الألوان:</h5>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>متاح</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>محجوز</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>في الانتظار</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>مكتمل</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendar; 