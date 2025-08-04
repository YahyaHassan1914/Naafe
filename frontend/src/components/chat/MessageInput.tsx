import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Image, File, X } from 'lucide-react';
import Button from '../ui/Button';

interface MessageInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
  allowAttachments?: boolean;
  className?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'اكتب رسالتك...',
  disabled = false,
  loading = false,
  maxLength = 1000,
  allowAttachments = true,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (loading || disabled) return;

    onSendMessage(message.trim(), attachments);
    setMessage('');
    setAttachments([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/*', 'application/pdf', 'text/plain', 'application/msword'];
      
      if (file.size > maxSize) {
        alert(`الملف ${file.name} كبير جداً. الحد الأقصى 10MB`);
        return false;
      }
      
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      alert('يمكن إرفاق 5 ملفات كحد أقصى');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type === 'application/pdf') return <File className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white border-t border-gray-200 p-4 ${className}`}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">الملفات المرفقة:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttachments([])}
              className="text-xs text-red-600 hover:text-red-700"
            >
              إزالة الكل
            </Button>
          </div>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3">
        {/* File Attachment Button */}
        {allowAttachments && (
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,text/plain,application/msword"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || loading}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="إرفاق ملف"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Message Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || loading}
            maxLength={maxLength}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          {maxLength && (
            <div className="absolute bottom-1 left-2 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="flex-shrink-0">
          <Button
            onClick={handleSendMessage}
            disabled={disabled || loading || (!message.trim() && attachments.length === 0)}
            loading={loading}
            className="p-3 rounded-lg"
            title="إرسال"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="mt-2 text-xs text-gray-500">
          جاري الكتابة...
        </div>
      )}
    </div>
  );
};

export default MessageInput; 