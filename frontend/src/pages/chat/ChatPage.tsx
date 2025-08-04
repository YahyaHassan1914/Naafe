import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import { ChatInterface } from '../../components/chat';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Conversation {
  id: string;
  participants: ChatParticipant[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API hooks
  const { data: conversationData, error: conversationError } = useApi(
    `/chat/conversations/${conversationId}`
  );

  // Load conversation data
  useEffect(() => {
    if (conversationData?.success) {
      setConversation(conversationData.data.conversation);
    } else if (conversationError) {
      setError('فشل في تحميل المحادثة');
      showError('فشل في تحميل المحادثة');
    }
    setLoading(false);
  }, [conversationData, conversationError, showError]);

  const handleBack = () => {
    navigate('/conversations');
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">جاري تحميل المحادثة...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !conversation) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل المحادثة</h3>
            <p className="text-gray-500 mb-4">{error || 'حدث خطأ غير متوقع'}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleBack} variant="outline">
                العودة للمحادثات
              </Button>
              <Button onClick={() => window.location.reload()}>
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full">
        <ChatInterface
          conversationId={conversationId!}
          participants={conversation.participants}
          onBack={handleBack}
          className="h-full"
        />
      </div>
    </PageLayout>
  );
};

export default ChatPage; 