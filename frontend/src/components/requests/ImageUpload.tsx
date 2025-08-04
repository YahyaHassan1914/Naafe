import React, { useState, useRef, useCallback } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

interface ImagePreview {
  file: File;
  url: string;
  id: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagePreviews: ImagePreview[] = images.map((file, index) => ({
    file,
    url: URL.createObjectURL(file),
    id: `${file.name}-${index}`
  }));

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.';
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return `حجم الملف كبير جداً. الحد الأقصى هو ${maxSizeMB} ميجابايت.`;
    }

    return null;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert('أخطاء في الملفات:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const currentCount = images.length;
      const remainingSlots = maxImages - currentCount;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      if (filesToAdd.length < validFiles.length) {
        alert(`يمكن إضافة ${remainingSlots} صور فقط. تم تجاهل الباقي.`);
      }

      const newImages = [...images, ...filesToAdd];
      onChange(newImages);
    }
  }, [images, maxImages, onChange, acceptedTypes, maxSize]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const newImages = images.filter((_, index) => {
      const preview = imagePreviews[index];
      return preview.id !== imageId;
    });
    onChange(newImages);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          صور الطلب
        </label>
        <p className="text-sm text-text-secondary mb-4">
          أضف صور توضيحية للطلب (اختياري). الحد الأقصى {maxImages} صور، كل صورة بحد أقصى {formatFileSize(maxSize)}.
        </p>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-deep-teal bg-teal-50'
              : 'border-gray-300 hover:border-deep-teal hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleImageClick}
        >
          <div className="space-y-4">
            <div className="text-4xl">📷</div>
            <div>
              <p className="text-lg font-medium text-text-primary">
                اسحب الصور هنا أو انقر للاختيار
              </p>
              <p className="text-sm text-text-secondary mt-1">
                JPG, PNG, WebP حتى {formatFileSize(maxSize)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleImageClick();
              }}
            >
              اختيار الصور
            </Button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-primary">
            الصور المرفقة ({imagePreviews.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagePreviews.map((preview) => (
              <div
                key={preview.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with remove button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveImage(preview.id)}
                  >
                    حذف
                  </Button>
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                  <p className="truncate">{preview.file.name}</p>
                  <p>{formatFileSize(preview.file.size)}</p>
                </div>

                {/* Loading indicator */}
                {uploadingImages.includes(preview.id) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <LoadingSpinner size="sm" variant="white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Image list for mobile */}
          <div className="md:hidden space-y-2">
            {imagePreviews.map((preview) => (
              <div
                key={preview.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatFileSize(preview.file.size)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemoveImage(preview.id)}
                >
                  حذف
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadingImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <LoadingSpinner size="sm" variant="primary" />
            <span className="text-sm text-blue-800">
              جاري رفع {uploadingImages.length} صورة...
            </span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-text-secondary space-y-1">
        <p>• يمكنك رفع حتى {maxImages} صور</p>
        <p>• الحد الأقصى لحجم كل صورة: {formatFileSize(maxSize)}</p>
        <p>• الصيغ المدعومة: JPG, PNG, WebP</p>
        <p>• الصور ستساعد المزودين على فهم متطلباتك بشكل أفضل</p>
      </div>
    </div>
  );
};

export default ImageUpload; 