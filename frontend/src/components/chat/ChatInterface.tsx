import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Phone, Video, Info, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useApi } from '../../hooks/useApi';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  isRead: boolean;
  attachments?: MessageAttachment[];
  isOwn: boolean;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  participants: ChatParticipant[];
  onBack?: () => void;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  participants,
  onBack,
  className = ''
}) => {
  const { user } = useAuth();
  const { connected, on, emit } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // API hooks
  const { data: messagesData, refetch: refetchMessages } = useApi(
    `/chat/conversations/${conversationId}/messages?page=${page}&limit=50`
  );
  const { mutate: sendMessage } = useApi(`/chat/conversations/${conversationId}/messages`, 'POST');
  const { mutate: markAsRead } = useApi(`/chat/conversations/${conversationId}/read`, 'PATCH');

  // Load messages
  useEffect(() => {
    if (messagesData?.success) {
      const newMessages = messagesData.data.messages || [];
      if (page === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
      setHasMore(newMessages.length === 50);
    }
  }, [messagesData, page]);

  // Socket listeners
  useEffect(() => {
    if (!connected) return;

    // Listen for new messages
    on('new_message', (newMessage: Message) => {
      if (newMessage.conversationId === conversationId) {
        setMessages(prev => [...prev, newMessage]);
        // Mark as read if user is active
        markAsRead();
      }
    });

    // Listen for typing indicators
    on('typing_start', (data: { conversationId: string; userId: string; userName: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      }
    });

    on('typing_stop', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    // Listen for read receipts
    on('message_read', (data: { conversationId: string; messageId: string }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? { ...msg, isRead: true } : msg
          )
        );
      }
    });

    return () => {
      // Cleanup socket listeners
    };
  }, [connected, conversationId, user?.id, on, markAsRead]);

  // Mark conversation as read when component mounts
  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    if (sending) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (attachments) {
        attachments.forEach((file, index) => {
          formData.append(`attachments_${index}`, file);
        });
      }

      const response = await sendMessage(formData);
      
      // Optimistically add message to UI
      const newMessage: Message = {
        id: response.data.message.id,
        content: content,
        senderId: user?.id || '',
        senderName: user?.name || '',
        senderAvatar: user?.avatar,
        timestamp: new Date().toISOString(),
        isRead: false,
        attachments: response.data.message.attachments,
        isOwn: true
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleAttachmentClick = (attachment: MessageAttachment) => {
    // Open attachment in new tab or modal
    window.open(attachment.url, '_blank');
  };

  const emitTyping = (isTyping: boolean) => {
    if (connected) {
      emit(isTyping ? 'typing_start' : 'typing_stop', {
        conversationId,
        userId: user?.id,
        userName: user?.name
      });
    }
  };

  const getOtherParticipant = () => {
    return participants.find(p => p.id !== user?.id);
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="p-2"
            >
              ←
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {otherParticipant?.avatar ? (
                  <img
                    src={otherParticipant.avatar}
                    alt={otherParticipant.name}
                    className="w-10 h-10 rounded-full object-cover"
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
            
            <div>
              <h3 className="font-semibold text-gray-900">{otherParticipant?.name}</h3>
              <div className="flex items-center gap-2">
                {otherParticipant?.isOnline ? (
                  <span className="text-xs text-green-600">متصل الآن</span>
                ) : otherParticipant?.lastSeen ? (
                  <span className="text-xs text-gray-500">
                    آخر ظهور {new Date(otherParticipant.lastSeen).toLocaleTimeString('ar-SA')}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">غير متصل</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="البحث في المحادثة"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="مكالمة صوتية"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="مكالمة فيديو"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="معلومات المحادثة"
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="المزيد"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-600">
              {typingUsers.length === 1 ? 'جاري الكتابة...' : `${typingUsers.length} أشخاص يكتبون...`}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        loadingMore={page > 1}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onAttachmentClick={handleAttachmentClick}
        currentUserId={user?.id || ''}
        className="flex-1"
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!connected}
        loading={sending}
        placeholder="اكتب رسالتك..."
        allowAttachments={true}
        maxLength={1000}
      />
    </div>
  );
};

export default ChatInterface; 