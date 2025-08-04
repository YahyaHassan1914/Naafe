import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, AlertCircle, Clock, CheckCircle, XCircle, DollarSign, Calendar, MessageSquare, User, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'provider';
  content: string;
  timestamp: string;
  type: 'message' | 'counter_offer' | 'status_update';
  offerData?: {
    price: number;
    timeline: string;
    scope: string;
    paymentSchedule: string;
  };
  status?: 'pending' | 'accepted' | 'rejected';
}

interface NegotiationPanelProps {
  offerId: string;
  requestId: string;
  initialOffer: {
    id: string;
    price: number;
    timeline: string;
    scope: string;
    paymentSchedule: string;
    status: string;
    provider: {
      id: string;
      name: string;
      avatar?: string;
    };
    client: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  onOfferUpdate?: (offerData: any) => void;
}

const NegotiationPanel: React.FC<NegotiationPanelProps> = ({
  offerId,
  requestId,
  initialOffer,
  onOfferUpdate
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterOffer, setCounterOffer] = useState({
    price: initialOffer.price,
    timeline: initialOffer.timeline,
    scope: initialOffer.scope,
    paymentSchedule: initialOffer.paymentSchedule
  });

  // Mock API hooks - replace with actual API calls
  const { data: negotiationData, loading: loadingMessages } = useApi(`/negotiations/${offerId}/messages`);
  const { mutate: sendMessage, loading: sendingMessage } = useApi(`/negotiations/${offerId}/messages`, 'POST');
  const { mutate: sendCounterOffer, loading: sendingCounterOffer } = useApi(`/negotiations/${offerId}/counter-offer`, 'POST');

  useEffect(() => {
    if (negotiationData?.messages) {
      setMessages(negotiationData.messages);
    }
  }, [negotiationData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const messageData = {
        content: newMessage,
        type: 'message',
        senderId: user?.id,
        senderName: user?.name,
        senderRole: user?.role === 'provider' ? 'provider' : 'client'
      };

      await sendMessage(messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCounterOffer = async () => {
    setIsLoading(true);
    try {
      const counterOfferData = {
        ...counterOffer,
        type: 'counter_offer',
        senderId: user?.id,
        senderName: user?.name,
        senderRole: user?.role === 'provider' ? 'provider' : 'client'
      };

      await sendCounterOffer(counterOfferData);
      setShowCounterOffer(false);
      onOfferUpdate?.(counterOffer);
    } catch (error) {
      console.error('Error sending counter offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === user?.id;
  };

  const renderMessage = (message: Message) => {
    const isOwn = isOwnMessage(message);

    if (message.type === 'counter_offer') {
      return (
        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-md ${isOwn ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">عرض مضاد</span>
            </div>
            
            {message.offerData && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">السعر:</span>
                  <span className="font-medium">{message.offerData.price} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المدة:</span>
                  <span className="font-medium">{message.offerData.timeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">النطاق:</span>
                  <span className="font-medium">{message.offerData.scope}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">جدول الدفع:</span>
                  <span className="font-medium">{message.offerData.paymentSchedule}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
              <span className="text-xs text-gray-500">{message.senderName}</span>
            </div>
          </div>
        </div>
      );
    }

    if (message.type === 'status_update') {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">{message.content}</span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">{formatTimestamp(message.timestamp)}</div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-md ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-4 py-2`}>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
            <span className="text-xs opacity-70">{message.senderName}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">المفاوضات</h3>
              <p className="text-sm text-gray-500">عرض #{offerId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCounterOffer(!showCounterOffer)}
              disabled={isLoading}
            >
              <DollarSign className="w-4 h-4 ml-2" />
              عرض مضاد
            </Button>
          </div>
        </div>
      </div>

      {/* Counter Offer Form */}
      {showCounterOffer && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="السعر (ريال)"
                type="number"
                value={counterOffer.price}
                onChange={(e) => setCounterOffer(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="أدخل السعر"
              />
              <FormInput
                label="المدة"
                value={counterOffer.timeline}
                onChange={(e) => setCounterOffer(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="مثال: 5 أيام"
              />
            </div>
            <FormInput
              label="نطاق العمل"
              value={counterOffer.scope}
              onChange={(e) => setCounterOffer(prev => ({ ...prev, scope: e.target.value }))}
              placeholder="وصف نطاق العمل"
            />
            <FormInput
              label="جدول الدفع"
              value={counterOffer.paymentSchedule}
              onChange={(e) => setCounterOffer(prev => ({ ...prev, paymentSchedule: e.target.value }))}
              placeholder="مثال: 50% مقدماً، 50% عند الإنجاز"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSendCounterOffer}
                loading={sendingCounterOffer}
                disabled={isLoading}
              >
                إرسال العرض المضاد
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCounterOffer(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">لا توجد رسائل بعد</p>
            <p className="text-xs">ابدأ المحادثة بإرسال رسالة</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              loading={sendingMessage}
              disabled={!newMessage.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => {
            // Handle file upload
            console.log('File selected:', e.target.files?.[0]);
          }}
        />
      </div>
    </div>
  );
};

export default NegotiationPanel; 