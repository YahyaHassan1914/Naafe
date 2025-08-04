import React, { useState, useRef } from 'react';
import { Upload, File, Image, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedTypes: string[];
  maxSize: number; // in MB
  examples?: string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  rejectionReason?: string;
}

interface DocumentUploadProps {
  onDocumentsChange?: (documents: UploadedDocument[]) => void;
  onComplete?: () => void;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentsChange,
  onComplete,
  className = ''
}) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { mutate: uploadDocument } = useApi('/verification/documents/upload', 'POST');
  const { mutate: deleteDocument } = useApi('/verification/documents/:id', 'DELETE');

  const documentTypes: DocumentType[] = [
    {
      id: 'national-id',
      name: 'الهوية الوطنية',
      description: 'صورة واضحة من الهوية الوطنية أو جواز السفر',
      required: true,
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5,
      examples: ['الهوية الوطنية', 'جواز السفر']
    },
    {
      id: 'certificate',
      name: 'الشهادات والمؤهلات',
      description: 'شهادات التخرج أو المؤهلات المهنية',
      required: true,
      acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize: 10,
      examples: ['شهادة التخرج', 'شهادة مهنية', 'دورات تدريبية']
    },
    {
      id: 'experience',
      name: 'إثبات الخبرة',
      description: 'شهادات خبرة أو عقود عمل سابقة',
      required: false,
      acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize: 10,
      examples: ['شهادة خبرة', 'عقد عمل', 'مراجع']
    },
    {
      id: 'portfolio',
      name: 'معرض الأعمال',
      description: 'صور لأعمال سابقة أو مشاريع منجزة',
      required: false,
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5,
      examples: ['صور الأعمال', 'المشاريع المنجزة']
    }
  ];

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploading(true);

    try {
      for (const file of fileArray) {
        await uploadSingleFile(file);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await uploadDocument(formData);
      
      const newDocument: UploadedDocument = {
        id: response.data.document.id,
        name: file.name,
        url: response.data.document.url,
        type: file.type,
        size: file.size,
        status: 'pending',
        uploadedAt: new Date().toISOString()
      };

      setUploadedDocuments(prev => [...prev, newDocument]);
      
      if (onDocumentsChange) {
        onDocumentsChange([...uploadedDocuments, newDocument]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ في رفع الملف');
    }
  };

  const validateFile = (file: File) => {
    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'حجم الملف كبير جداً. الحد الأقصى 10MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'نوع الملف غير مدعوم' };
    }

    return { isValid: true, error: '' };
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument({ id: documentId });
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      if (onDocumentsChange) {
        onDocumentsChange(uploadedDocuments.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('حدث خطأ في حذف الملف');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="text-xs">مقبول</Badge>;
      case 'rejected':
        return <Badge variant="error" className="text-xs">مرفوض</Badge>;
      default:
        return <Badge variant="warning" className="text-xs">قيد المراجعة</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Types Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3">الوثائق المطلوبة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((docType) => (
            <div key={docType.id} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <File className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-blue-900">{docType.name}</h4>
                  {docType.required && (
                    <Badge variant="error" className="text-xs">مطلوب</Badge>
                  )}
                </div>
                <p className="text-sm text-blue-700">{docType.description}</p>
                <p className="text-xs text-blue-600 mt-1">
                  الحد الأقصى: {docType.maxSize}MB
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          اسحب الملفات هنا أو انقر للاختيار
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          يمكنك رفع ملفات JPG, PNG, PDF. الحد الأقصى 10MB لكل ملف
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          loading={uploading}
          variant="outline"
        >
          اختيار ملفات
        </Button>
      </div>

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">الملفات المرفوعة</h3>
          <div className="space-y-3">
            {uploadedDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(document.type)}
                  <div>
                    <h4 className="font-medium text-gray-900">{document.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(document.size)} • {new Date(document.uploadedAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(document.status)}
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                      className="p-1"
                      title="عرض الملف"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="حذف الملف"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-900">جاري رفع الملفات...</span>
          </div>
        </div>
      )}

      {/* Completion Check */}
      {uploadedDocuments.length > 0 && !uploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-900">
              تم رفع {uploadedDocuments.length} ملف بنجاح
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 