import express from 'express';
const router = express.Router();
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import User from '../models/User.js';
import ServiceListing from '../models/ServiceListing.js';

// Mock booking data (in a real app, this would be a separate Booking model)
let bookings = [];

/**
 * @route   GET /api/booking/provider/:providerId/schedule
 * @desc    Get provider's schedule and availability
 * @access  Public
 * @param   {string} providerId - Provider's user ID
 * @query   {string} month - Month in YYYY-MM format
 * @returns {object} Provider's schedule for the month
 */
router.get('/provider/:providerId/schedule', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { month } = req.query;

    // Get provider info
    const provider = await User.findById(providerId).select('name avatar providerProfile');
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: { message: 'المحترف غير موجود' }
      });
    }

    // Get provider's service listing for availability settings
    const serviceListing = await ServiceListing.findOne({ provider: providerId });
    
    // Generate schedule for the month
    const schedule = generateMonthlySchedule(month, serviceListing, bookings, providerId);

    res.json({
      success: true,
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          avatar: provider.avatar,
          category: provider.providerProfile?.skills?.[0] || 'خدمة عامة',
          rating: provider.providerProfile?.rating || 0,
          isVerified: provider.providerProfile?.isVerified || false,
          phone: provider.phone
        },
        schedule
      }
    });

  } catch (error) {
    console.error('Error fetching provider schedule:', error);
    res.status(500).json({
      success: false,
      error: { message: 'فشل في تحميل الجدول' }
    });
  }
});

/**
 * @route   POST /api/booking/book
 * @desc    Book a time slot with a provider
 * @access  Private (Seekers only)
 * @body    {object} Booking data
 * @returns {object} Confirmed booking
 */
router.post('/book',
  authenticateToken,
  requireRole(['seeker']),
  async (req, res) => {
    try {
      const { providerId, date, startTime, endTime, notes } = req.body;
      const seekerId = req.user.id;

      // Validate booking data
      if (!providerId || !date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: { message: 'جميع البيانات مطلوبة' }
        });
      }

      // Check if provider exists
      const provider = await User.findById(providerId);
      if (!provider) {
        return res.status(404).json({
          success: false,
          error: { message: 'المحترف غير موجود' }
        });
      }

      // Check if time slot is available
      const isAvailable = checkSlotAvailability(providerId, date, startTime, endTime, bookings);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: { message: 'هذا الموعد غير متاح' }
        });
      }

      // Create booking
      const booking = {
        id: `booking-${Date.now()}`,
        providerId,
        seekerId,
        date,
        startTime,
        endTime,
        status: 'pending',
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      bookings.push(booking);

      // In a real app, you would save to database and send notifications
      // await Booking.create(booking);
      // await sendNotification(providerId, 'new_booking', booking);

      res.json({
        success: true,
        data: booking,
        message: 'تم الحجز بنجاح'
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        error: { message: 'فشل في إنشاء الحجز' }
      });
    }
  }
);

/**
 * @route   PUT /api/booking/:bookingId/status
 * @desc    Update booking status (confirm, cancel, complete)
 * @access  Private (Provider or Seeker)
 * @param   {string} bookingId - Booking ID
 * @body    {string} status - New status
 * @returns {object} Updated booking
 */
router.put('/:bookingId/status',
  authenticateToken,
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Find booking
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { message: 'الحجز غير موجود' }
        });
      }

      // Check permissions
      if (booking.providerId !== userId && booking.seekerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'غير مصرح لك بتعديل هذا الحجز' }
        });
      }

      // Update status
      booking.status = status;
      booking.updatedAt = new Date();

      // In a real app, you would update in database and send notifications
      // await Booking.findByIdAndUpdate(bookingId, { status });
      // await sendNotification(booking.providerId, 'booking_updated', booking);

      res.json({
        success: true,
        data: booking,
        message: 'تم تحديث الحجز بنجاح'
      });

    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({
        success: false,
        error: { message: 'فشل في تحديث الحجز' }
      });
    }
  }
);

/**
 * @route   GET /api/booking/my-bookings
 * @desc    Get user's bookings (as provider or seeker)
 * @access  Private
 * @query   {string} role - 'provider' or 'seeker'
 * @returns {object} User's bookings
 */
router.get('/my-bookings',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { role } = req.query;

      let userBookings = [];

      if (role === 'provider') {
        userBookings = bookings.filter(b => b.providerId === userId);
      } else {
        userBookings = bookings.filter(b => b.seekerId === userId);
      }

      // Populate user details
      const populatedBookings = await Promise.all(
        userBookings.map(async (booking) => {
          const provider = await User.findById(booking.providerId).select('name avatar');
          const seeker = await User.findById(booking.seekerId).select('name avatar');
          
          return {
            ...booking,
            provider: {
              id: provider._id,
              name: provider.name,
              avatar: provider.avatar
            },
            seeker: {
              id: seeker._id,
              name: seeker.name,
              avatar: seeker.avatar
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          bookings: populatedBookings,
          totalCount: populatedBookings.length
        }
      });

    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({
        success: false,
        error: { message: 'فشل في تحميل الحجوزات' }
      });
    }
  }
);

// Helper functions
function generateMonthlySchedule(month, serviceListing, bookings, providerId) {
  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);
  const daysInMonth = lastDay.getDate();

  const schedule = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dateString = date.toISOString().split('T')[0];
    const isPast = date < new Date();
    const isFriday = date.getDay() === 5;

    // Check if provider is available on this day
    const isAvailable = !isPast && !isFriday && 
      (!serviceListing?.availability?.days || 
       serviceListing.availability.days.includes(date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()));

    const timeSlots = generateTimeSlots(dateString, providerId, bookings, isAvailable);
    
    schedule.push({
      date: dateString,
      dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
      isAvailable,
      timeSlots
    });
  }

  return schedule;
}

function generateTimeSlots(date, providerId, bookings, isAvailable) {
  if (!isAvailable) return [];

  const slots = [];
  const startHour = 8;
  const endHour = 18;
  const slotDuration = 2;

  for (let hour = startHour; hour < endHour; hour += slotDuration) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00`;
    
    // Check if slot is booked
    const booking = bookings.find(b => 
      b.providerId === providerId && 
      b.date === date && 
      b.startTime === startTime &&
      b.status !== 'cancelled'
    );

    slots.push({
      id: `${date}-${startTime}`,
      startTime,
      endTime,
      status: booking ? 'booked' : 'available',
      jobId: booking?.id,
      clientName: booking?.clientName,
      jobTitle: booking?.jobTitle
    });
  }

  return slots;
}

function checkSlotAvailability(providerId, date, startTime, endTime, bookings) {
  // Check if slot is already booked
  const conflictingBooking = bookings.find(b => 
    b.providerId === providerId && 
    b.date === date && 
    b.status !== 'cancelled' &&
    ((b.startTime <= startTime && b.endTime > startTime) ||
     (b.startTime < endTime && b.endTime >= endTime) ||
     (b.startTime >= startTime && b.endTime <= endTime))
  );

  return !conflictingBooking;
}

export default router; 