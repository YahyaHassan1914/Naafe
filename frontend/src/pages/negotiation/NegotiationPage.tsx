import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import NegotiationPanel from '../../components/negotiation/NegotiationPanel';
import CounterOfferForm from '../../components/negotiation/CounterOfferForm';
import NegotiationTimeline from '../../components/negotiation/NegotiationTimeline';
import OfferDetails from '../../components/offers/OfferDetails';

interface NegotiationPageProps {}

const NegotiationPage: React.FC<NegotiationPageProps> = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline' | 'counter-offer'>('chat');
  const [showCounterOfferForm, setShowCounterOfferForm] = useState(false);

  // API hooks
  const { data: offer, loading: loadingOffer, error: offerError } = useApi(`/offers/${offerId}`);
  const { data: negotiationEvents, loading: loadingEvents } = useApi(`/negotiations/${offerId}/events`);
  const { mutate: updateOffer, loading: updatingOffer } = useApi(`/offers/${offerId}`, 'PUT');

  useEffect(() => {
    if (offerError) {
      console.error('Error loading offer:', offerError);
    }
  }, [offerError]);

  const handleOfferUpdate = async (updatedData: any) => {
    try {
      await updateOffer(updatedData);
      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Error updating offer:', error);
    }
  };

  const handleCounterOfferSubmit = async (counterOfferData: any) => {
    try {
      // Send counter offer through negotiation API
      const response = await fetch(`/api/negotiations/${offerId}/counter-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(counterOfferData),
      });

      if (response.ok) {
        setShowCounterOfferForm(false);
        // Refresh events
        window.location.reload();
      }
    } catch (error) {
      console.error('Error submitting counter offer:', error);
    }
  };

  const canNegotiate = () => {
    if (!offer || !user) return false;
    
    // Client can negotiate if offer is pending
    if (user.role === 'client' && offer.status === 'pending') {
      return true;
    }
    
    // Provider can negotiate if offer is pending or under negotiation
    if (user.role === 'provider' && ['pending', 'negotiating'].includes(offer.status)) {
      return true;
    }
    
    return false;
  };

  if (loadingOffer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (offerError || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">خطأ في تحميل العرض</h2>
          <p className="text-gray-600 mb-4">تعذر تحميل تفاصيل العرض المطلوب</p>
          <Button onClick={() => navigate('/offers')}>
            العودة إلى العروض
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <div>
                <h1 className="text-lg font-medium text-gray-900">مفاوضات العرض</h1>
                <p className="text-sm text-gray-500">عرض #{offerId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {offer.status === 'accepted' ? 'مقبول' :
                 offer.status === 'rejected' ? 'مرفوض' :
                 offer.status === 'pending' ? 'قيد المراجعة' :
                 offer.status === 'negotiating' ? 'قيد المفاوضة' :
                 offer.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Offer Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OfferDetails
                offer={offer}
                isEditable={false}
                onSave={() => {}}
                showActions={false}
              />
              
              {canNegotiate() && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowCounterOfferForm(true)}
                    className="w-full"
                    disabled={updatingOffer}
                  >
                    <DollarSign className="w-4 h-4 ml-2" />
                    إنشاء عرض مضاد
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Negotiation Interface */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === 'chat'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    المحادثة
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === 'timeline'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    الجدول الزمني
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'chat' && (
                <NegotiationPanel
                  offerId={offerId!}
                  requestId={offer.requestId}
                  initialOffer={offer}
                  onOfferUpdate={handleOfferUpdate}
                />
              )}

              {activeTab === 'timeline' && (
                <NegotiationTimeline
                  events={negotiationEvents?.events || []}
                  loading={loadingEvents}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counter Offer Modal */}
      {showCounterOfferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CounterOfferForm
              originalOffer={offer}
              onSubmit={handleCounterOfferSubmit}
              onCancel={() => setShowCounterOfferForm(false)}
              loading={updatingOffer}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationPage; 