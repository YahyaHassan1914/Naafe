import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Plus, MoreVertical, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import FormInput from '../../components/ui/FormInput';

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
    senderName: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

const ChatHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  // API hooks
  const { data: conversationsData, error: conversationsError, refetch: refetchConversations } = useApi(
    '/chat/conversations'
  );

  // Load conversations
  useEffect(() => {
    if (conversationsData?.success) {
      setConversations(conversationsData.data.conversations || []);
    } else if (conversationsError) {
      showError('فشل في تحميل المحادثات');
    }
    setLoading(false);
  }, [conversationsData, conversationsError, showError]);

  // Filter conversations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const participantNames = conversation.participants
          .filter(p => p.id !== user?.id)
          .map(p => p.name.toLowerCase());
        
        const lastMessageContent = conversation.lastMessage?.content.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return participantNames.some(name => name.includes(searchLower)) ||
               lastMessageContent.includes(searchLower);
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchTerm, user?.id]);

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleNewChat = () => {
    navigate('/chat/new');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    if (diffInMinutes < 10080) return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
    
    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
  };

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">جاري تحميل المحادثات...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">المحادثات</h1>
              <p className="text-sm text-gray-500">إدارة محادثاتك ورسائلك</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getUnreadCount() > 0 && (
              <Badge variant="error" className="text-xs">
                {getUnreadCount()} جديد
              </Badge>
            )}
            <Button
              onClick={handleNewChat}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              محادثة جديدة
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <FormInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في المحادثات..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'لا توجد نتائج' : 'لا توجد محادثات'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'جرب البحث بكلمات مختلفة'
                  : 'ابدأ محادثة جديدة للتواصل مع الآخرين'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleNewChat}>
                  بدء محادثة جديدة
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isUnread = conversation.unreadCount > 0;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        {otherParticipant?.avatar ? (
                          <img
                            src={otherParticipant.avatar}
                            alt={otherParticipant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {otherParticipant?.name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {otherParticipant?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${
                          isUnread ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {otherParticipant?.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                          </span>
                          {isUnread && (
                            <Badge variant="error" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {conversation.lastMessage.senderId === user?.id ? 'أنت: ' : ''}
                            {conversation.lastMessage.content}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more actions
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ChatHistoryPage; 