import React, { useState } from 'react';
import { Clock, Check, CheckCheck, Download, Eye, EyeOff } from 'lucide-react';
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

interface MessageProps {
  message: Message;
  onAttachmentClick?: (attachment: MessageAttachment) => void;
  className?: string;
}

const Message: React.FC<MessageProps> = ({
  message,
  onAttachmentClick,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    
    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
  };

  const handleAttachmentClick = (attachment: MessageAttachment) => {
    if (onAttachmentClick) {
      onAttachmentClick(attachment);
    } else {
      // Default behavior: open in new tab
      window.open(attachment.url, '_blank');
    }
  };

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!message.isOwn && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {message.senderAvatar ? (
                <img
                  src={message.senderAvatar}
                  alt={message.senderName}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender Name (for group chats) */}
          {!message.isOwn && (
            <span className="text-xs text-gray-500 mb-1">{message.senderName}</span>
          )}

          {/* Message Bubble */}
          <div
            className={`rounded-lg px-4 py-2 max-w-full ${
              message.isOwn
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}
          >
            {/* Text Content */}
            {message.content && (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`border rounded-lg overflow-hidden ${
                      message.isOwn ? 'border-blue-400' : 'border-gray-300'
                    }`}
                  >
                    {/* Image Attachment */}
                    {attachment.type.startsWith('image/') && (
                      <div className="relative group">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="max-w-full max-h-48 object-cover cursor-pointer"
                          onClick={() => handleAttachmentClick(attachment)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 text-white"
                            onClick={() => handleAttachmentClick(attachment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* File Attachment */}
                    {!attachment.type.startsWith('image/') && (
                      <div
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleAttachmentClick(attachment)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                          </div>
                          <Download className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Status */}
          <div className={`flex items-center gap-1 mt-1 ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            {message.isOwn && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message; 