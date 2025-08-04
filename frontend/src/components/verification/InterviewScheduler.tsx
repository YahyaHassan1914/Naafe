import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import FormInput from '../ui/FormInput';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  booked: boolean;
}

interface InterviewSlot {
  id: string;
  date: string;
  timeSlots: TimeSlot[];
}

interface InterviewType {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  icon: React.ComponentType<any>;
}

interface InterviewSchedulerProps {
  onSchedule?: (interviewData: any) => void;
  onComplete?: () => void;
  className?: string;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  onSchedule,
  onComplete,
  className = ''
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // API hooks
  const { data: availableSlots, refetch: refetchSlots } = useApi('/verification/interview/slots');
  const { mutate: scheduleInterview } = useApi('/verification/interview/schedule', 'POST');

  const interviewTypes: InterviewType[] = [
    {
      id: 'video',
      name: 'مقابلة فيديو',
      description: 'مقابلة عبر الفيديو باستخدام Zoom أو Google Meet',
      duration: 30,
      icon: Video
    },
    {
      id: 'phone',
      name: 'مقابلة هاتفية',
      description: 'مقابلة عبر الهاتف في الوقت المحدد',
      duration: 20,
      icon: Phone
    },
    {
      id: 'in-person',
      name: 'مقابلة شخصية',
      description: 'مقابلة في مكتبنا في القاهرة',
      duration: 45,
      icon: MapPin
    }
  ];

  // Generate available dates (next 14 days)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (Friday and Saturday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // 5 = Friday, 6 = Saturday
        dates.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('ar-SA', { weekday: 'long' }),
          dayNumber: date.getDate(),
          month: date.toLocaleDateString('ar-SA', { month: 'short' })
        });
      }
    }
    
    return dates;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        id: `${hour}:00`,
        time: `${hour}:00`,
        available: Math.random() > 0.3, // 70% availability
        booked: false
      });
      
      if (hour < endHour - 1) {
        slots.push({
          id: `${hour}:30`,
          time: `${hour}:30`,
          available: Math.random() > 0.3,
          booked: false
        });
      }
    }
    
    return slots;
  };

  const availableDates = generateAvailableDates();
  const timeSlots = generateTimeSlots();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
    refetchSlots(); // Fetch available slots for selected date
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedType) {
      alert('يرجى اختيار التاريخ والوقت ونوع المقابلة');
      return;
    }

    setScheduling(true);
    try {
      const interviewData = {
        date: selectedDate,
        time: selectedTime,
        type: selectedType,
        notes: ''
      };

      await scheduleInterview(interviewData);
      
      if (onSchedule) {
        onSchedule(interviewData);
      }
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('حدث خطأ في جدولة المقابلة');
    } finally {
      setScheduling(false);
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

  const getSelectedTypeInfo = () => {
    return interviewTypes.find(type => type.id === selectedType);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Interview Types */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">نوع المقابلة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {interviewTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <div
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-500">{type.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      المدة: {type.duration} دقيقة
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">اختيار التاريخ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {availableDates.map((date) => {
            const isSelected = selectedDate === date.date;
            
            return (
              <div
                key={date.date}
                onClick={() => handleDateSelect(date.date)}
                className={`p-3 border rounded-lg cursor-pointer text-center transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-sm font-medium ${
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {date.dayName}
                </div>
                <div className={`text-lg font-bold ${
                  isSelected ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {date.dayNumber}
                </div>
                <div className={`text-xs ${
                  isSelected ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {date.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">
            اختيار الوقت - {formatDate(selectedDate)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const isDisabled = !slot.available || slot.booked;
              
              return (
                <button
                  key={slot.id}
                  onClick={() => !isDisabled && handleTimeSelect(slot.time)}
                  disabled={isDisabled}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{slot.time}</span>
                  </div>
                  {slot.booked && (
                    <div className="text-xs text-red-500 mt-1">محجوز</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Interview Summary */}
      {selectedDate && selectedTime && selectedType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3">تفاصيل المقابلة</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">الساعة {selectedTime}</span>
            </div>
            <div className="flex items-center gap-3">
              {getSelectedTypeInfo()?.icon && (
                <getSelectedTypeInfo()!.icon className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-blue-900">{getSelectedTypeInfo()?.name}</span>
            </div>
            <div className="text-sm text-blue-700 mt-2">
              {getSelectedTypeInfo()?.description}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">تعليمات المقابلة</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• تأكد من تواجدك قبل 5 دقائق من الموعد المحدد</li>
              <li>• احضر معك الهوية الوطنية أو جواز السفر</li>
              <li>• للمقابلة عبر الفيديو، تأكد من جودة الاتصال بالإنترنت</li>
              <li>• للمقابلة الشخصية، احضر إلى العنوان المحدد</li>
              <li>• يمكنك إلغاء أو تغيير الموعد قبل 24 ساعة من المقابلة</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Schedule Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSchedule}
          disabled={!selectedDate || !selectedTime || !selectedType || scheduling}
          loading={scheduling}
          className="min-w-[200px]"
        >
          جدولة المقابلة
        </Button>
      </div>
    </div>
  );
};

export default InterviewScheduler; 