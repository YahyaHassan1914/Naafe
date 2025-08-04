import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, User, Calendar, Image, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title: string;
    comment: string;
    photos?: string[];
    categories: string[];
    isAnonymous: boolean;
    createdAt: string;
    updatedAt?: string;
    helpfulCount: number;
    unhelpfulCount: number;
    isHelpful?: boolean;
    isUnhelpful?: boolean;
    reviewer: {
      id: string;
      name: string;
      avatar?: string;
    };
    provider: {
      id: string;
      name: string;
    };
    service: {
      id: string;
      title: string;
      category: string;
    };
  };
  showProviderInfo?: boolean;
  showServiceInfo?: boolean;
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  onReport?: (reviewId: string, reason: string) => void;
  onReply?: (reviewId: string, reply: string) => void;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showProviderInfo = true,
  showServiceInfo = true,
  onHelpful,
  onReport,
  onReply,
  className = ''
}) => {
  const { user } = useAuth();
  const [showFullComment, setShowFullComment] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  // API hooks
  const { mutate: markHelpful, loading: markingHelpful } = useApi('/reviews/helpful', 'POST');
  const { mutate: reportReview, loading: reportingReview } = useApi('/reviews/report', 'POST');
  const { mutate: addReply, loading: addingReply } = useApi('/reviews/reply', 'POST');

  const categoryLabels: Record<string, string> = {
    quality: 'جودة العمل',
    communication: 'التواصل',
    punctuality: 'الالتزام بالمواعيد',
    cleanliness: 'النظافة',
    professionalism: 'الاحترافية',
    value: 'قيمة مقابل السعر'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleHelpful = async (isHelpful: boolean) => {
    if (!user) return;

    try {
      await markHelpful({
        reviewId: review.id,
        isHelpful
      });
      onHelpful?.(review.id, isHelpful);
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportReason.trim()) return;

    try {
      await reportReview({
        reviewId: review.id,
        reason: reportReason
      });
      setShowReportForm(false);
      setReportReason('');
      onReport?.(review.id, reportReason);
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;

    try {
      await addReply({
        reviewId: review.id,
        reply: replyText
      });
      setShowReplyForm(false);
      setReplyText('');
      onReply?.(review.id, replyText);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const isCommentLong = review.comment.length > 200;
  const displayComment = showFullComment ? review.comment : review.comment.slice(0, 200);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {review.isAnonymous ? (
              <User className="w-5 h-5 text-gray-600" />
            ) : review.reviewer.avatar ? (
              <img
                src={review.reviewer.avatar}
                alt={review.reviewer.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-600" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">
                {review.isAnonymous ? 'مستخدم مجهول' : review.reviewer.name}
              </h4>
              {review.isAnonymous && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  مجهول
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.createdAt)}</span>
              {review.updatedAt && review.updatedAt !== review.createdAt && (
                <span className="text-xs text-gray-400">(محدث)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReport && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowReportForm(!showReportForm)}
              className="text-gray-400 hover:text-red-500"
            >
              <Flag className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">{review.rating} من 5</span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900 mb-2">{review.title}</h3>

      {/* Categories */}
      {review.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {review.categories.map((category) => (
            <span
              key={category}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {categoryLabels[category] || category}
            </span>
          ))}
        </div>
      )}

      {/* Comment */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {displayComment}
          {isCommentLong && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-blue-600 hover:text-blue-700 font-medium mr-2"
            >
              {showFullComment ? 'عرض أقل' : 'عرض المزيد'}
            </button>
          )}
        </p>
      </div>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">الصور المرفقة</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {review.photos.slice(0, showPhotos ? review.photos.length : 3).map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg cursor-pointer"
                  onClick={() => setShowPhotos(!showPhotos)}
                />
                {index === 2 && review.photos!.length > 3 && !showPhotos && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      +{review.photos!.length - 3}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {review.photos.length > 3 && (
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
            >
              {showPhotos ? (
                <>
                  <ChevronUp className="w-4 h-4 inline ml-1" />
                  عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 inline ml-1" />
                  عرض جميع الصور
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Service/Provider Info */}
      {(showServiceInfo || showProviderInfo) && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="space-y-1 text-sm">
            {showServiceInfo && (
              <div className="flex justify-between">
                <span className="text-gray-600">الخدمة:</span>
                <span className="font-medium text-gray-900">{review.service.title}</span>
              </div>
            )}
            {showProviderInfo && (
              <div className="flex justify-between">
                <span className="text-gray-600">مقدم الخدمة:</span>
                <span className="font-medium text-gray-900">{review.provider.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {/* Helpful/Unhelpful */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleHelpful(true)}
              disabled={markingHelpful}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                review.isHelpful
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{review.helpfulCount}</span>
            </button>
            
            <button
              onClick={() => handleHelpful(false)}
              disabled={markingHelpful}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                review.isUnhelpful
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>{review.unhelpfulCount}</span>
            </button>
          </div>

          {/* Reply */}
          {onReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>رد</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Form */}
      {showReportForm && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">الإبلاغ عن التقييم</h4>
          <form onSubmit={handleReport} className="space-y-3">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="اشرح سبب الإبلاغ..."
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              required
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                variant="danger"
                loading={reportingReview}
              >
                إرسال البلاغ
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowReportForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">إضافة رد</h4>
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب ردك على هذا التقييم..."
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                loading={addingReply}
              >
                إرسال الرد
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowReplyForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReviewCard; 