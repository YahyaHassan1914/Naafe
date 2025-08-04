import React, { useState, useEffect } from 'react';
import { Search, X, Mic, Camera } from 'lucide-react';
import Button from '../ui/Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  showVoiceSearch?: boolean;
  showImageSearch?: boolean;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'البحث عن الخدمات...',
  defaultValue = '',
  showVoiceSearch = true,
  showImageSearch = true,
  className = '',
  disabled = false,
  autoFocus = false
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setSearchTerm(defaultValue);
  }, [defaultValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('متصفحك لا يدعم البحث الصوتي');
      return;
    }

    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      onSearch(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert('حدث خطأ في البحث الصوتي');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Here you would typically upload the image and get search results
        // For now, we'll just show a placeholder
        alert('سيتم إضافة البحث بالصور قريباً');
      }
    };
    
    input.click();
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="block w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-right"
        />
        
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 left-0 flex items-center pl-3"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          {showVoiceSearch && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleVoiceSearch}
              disabled={disabled || isListening}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Mic className={`h-4 w-4 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
              <span>{isListening ? 'جاري الاستماع...' : 'بحث صوتي'}</span>
            </Button>
          )}
          
          {showImageSearch && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImageSearch}
              disabled={disabled}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Camera className="h-4 w-4" />
              <span>بحث بالصور</span>
            </Button>
          )}
        </div>

        <Button
          type="submit"
          disabled={disabled || !searchTerm.trim()}
          size="sm"
        >
          بحث
        </Button>
      </div>
    </form>
  );
};

export default SearchBar; 