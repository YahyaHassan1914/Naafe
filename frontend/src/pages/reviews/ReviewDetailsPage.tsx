import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Share, Flag, MessageCircle, ThumbsUp, ThumbsDown, Image, Calendar, User } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import ReviewCard from '../../components/reviews/ReviewCard';
import Button from '../../components/ui/Button';

interface Review {
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
    avatar?: string;
  };
  service: {
    id: string;
    title: string;
    category: string;
    subcategory: string;
  };
  replies?: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
}

const ReviewDetailsPage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // API hooks
  const { data: reviewData, loading, error } = useApi(`/reviews/${reviewId}`);
  const { mutate: addReply, loading: addingReply } = useApi('/reviews/reply', 'POST');
  const { mutate: markHelpful, loading: markingHelpful } = useApi('/reviews/helpful', 'POST');
  const { mutate: reportReview, loading: reportingReview } = useApi('/reviews/report', 'POST');

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;

    try {
      await addReply({
        reviewId: reviewId!,
        reply: replyText
      });
      setShowReplyForm(false);
      setReplyText('');
      // In a real app, you would refetch the review data
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleHelpful = async (isHelpful: boolean) => {
    if (!user) return;

    try {
      await markHelpful({
        reviewId: reviewId!,
        isHelpful
      });
      // In a real app, you would update the review data
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      await reportReview({
        reviewId: reviewId!,
        reason
      });
      // In a real app, you would show a success message
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: reviewData?.review?.title || 'تقييم',
        text: reviewData?.review?.comment || '',
        url: window.location.href
      });
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareModal(false);
    // In a real app, you would show a success message
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">جاري تحميل التقييم...</p>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <Star className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطأ في التحميل</h2>
            <p className="text-gray-600 mb-6">تعذر تحميل التقييم</p>
            <Button onClick={() => navigate('/reviews')}>
              العودة للتقييمات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const review: Review = reviewData.review;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تفاصيل التقييم</h1>
                <p className="text-gray-600">مراجعة شاملة للتقييم</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share className="w-4 h-4 ml-2" />
                مشاركة
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Review */}
          <div className="lg:col-span-2">
            <ReviewCard
              review={review}
              showProviderInfo={true}
              showServiceInfo={true}
              onHelpful={handleHelpful}
              onReport={handleReport}
              onReply={(reviewId, reply) => {
                setReplyText(reply);
                setShowReplyForm(true);
              }}
            />

            {/* Replies Section */}
            {review.replies && review.replies.length > 0 && (
              <div className="mt-8 bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">الردود</h3>
                  <p className="text-sm text-gray-600">{review.replies.length} رد</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {review.replies.map((reply) => (
                    <div key={reply.id} className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {reply.author.avatar ? (
                            <img
                              src={reply.author.avatar}
                              alt={reply.author.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{reply.author.name}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          <p className="text-gray-700">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Reply Form */}
            {showReplyForm && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">إضافة رد</h3>
                <form onSubmit={handleReply} className="space-y-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك على هذا التقييم..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      loading={addingReply}
                    >
                      إرسال الرد
                    </Button>
                    <Button
                      type="button"
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">تفاصيل الخدمة</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">الخدمة:</span>
                  <p className="font-medium text-gray-900">{review.service.title}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">الفئة:</span>
                  <p className="font-medium text-gray-900">{review.service.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">النوع:</span>
                  <p className="font-medium text-gray-900">{review.service.subcategory}</p>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">مقدم الخدمة</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {review.provider.avatar ? (
                    <img
                      src={review.provider.avatar}
                      alt={review.provider.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {review.provider.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{review.provider.name}</h4>
                  <p className="text-sm text-gray-500">مقدم خدمة موثق</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate(`/providers/${review.provider.id}`)}
              >
                عرض الملف الشخصي
              </Button>
            </div>

            {/* Review Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">إحصائيات التقييم</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">التقييم:</span>
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
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">مفيد:</span>
                  <span className="text-sm font-medium text-gray-900">{review.helpfulCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">غير مفيد:</span>
                  <span className="text-sm font-medium text-gray-900">{review.unhelpfulCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">تاريخ النشر:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                {review.updatedAt && review.updatedAt !== review.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">آخر تحديث:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(review.updatedAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            {review.categories.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">فئات التقييم</h3>
                <div className="flex flex-wrap gap-2">
                  {review.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {category === 'quality' ? 'جودة العمل' :
                       category === 'communication' ? 'التواصل' :
                       category === 'punctuality' ? 'الالتزام بالمواعيد' :
                       category === 'cleanliness' ? 'النظافة' :
                       category === 'professionalism' ? 'الاحترافية' :
                       category === 'value' ? 'قيمة مقابل السعر' : category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مشاركة التقييم</h3>
            <div className="space-y-3">
              <Button
                onClick={copyToClipboard}
                className="w-full"
              >
                نسخ الرابط
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
                className="w-full"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDetailsPage; 