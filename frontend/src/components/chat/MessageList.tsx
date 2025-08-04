import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import Message from './Message';
import Button from '../ui/Button';

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

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onAttachmentClick?: (attachment: MessageAttachment) => void;
  currentUserId: string;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onAttachmentClick,
  currentUserId,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Track new messages when user is scrolled up
  useEffect(() => {
    if (messages.length > lastMessageCount && userHasScrolled) {
      setNewMessagesCount(prev => prev + (messages.length - lastMessageCount));
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, userHasScrolled]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !userHasScrolled) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, userHasScrolled]);

  // Auto-scroll to bottom when component mounts
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Handle scroll events
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
    
    setUserHasScrolled(!isAtBottom);
    setShowScrollButton(!isAtBottom);

    // Auto-hide scroll button when near bottom
    if (isAtBottom) {
      setNewMessagesCount(0);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserHasScrolled(false);
    setShowScrollButton(false);
    setNewMessagesCount(0);
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={`relative flex-1 overflow-hidden ${className}`}>
      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm">
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600 mr-2">جاري تحميل المزيد...</span>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-2 space-y-4"
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              loading={loadingMore}
              disabled={loadingMore}
            >
              تحميل المزيد
            </Button>
          </div>
        )}

        {/* Messages */}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">جاري تحميل الرسائل...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-500">لا توجد رسائل بعد</p>
              <p className="text-sm text-gray-400">ابدأ المحادثة بإرسال رسالة</p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-500">{formatDate(date)}</span>
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => (
                <Message
                  key={message.id}
                  message={{
                    ...message,
                    isOwn: message.senderId === currentUserId
                  }}
                  onAttachmentClick={onAttachmentClick}
                />
              ))}
            </div>
          ))
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full shadow-lg"
            title="الانتقال للأسفل"
          >
            <ChevronDown className="w-5 h-5" />
            {newMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {newMessagesCount > 9 ? '9+' : newMessagesCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageList; 