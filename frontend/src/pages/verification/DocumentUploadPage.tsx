import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DocumentUpload from '../../components/verification/DocumentUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // API hooks
  const { data: documentsData, loading: documentsLoading, refetch: refetchDocuments } = useApi('/verification/documents');
  const { mutate: submitDocuments } = useApi('/verification/documents/submit', 'POST');

  useEffect(() => {
    if (documentsData?.success) {
      setUploadedDocuments(documentsData.data.documents || []);
      setIsComplete(documentsData.data.isComplete || false);
    }
  }, [documentsData]);

  const handleDocumentsChange = (documents: UploadedDocument[]) => {
    setUploadedDocuments(documents);
  };

  const handleComplete = () => {
    setIsComplete(true);
  };

  const handleSubmit = async () => {
    try {
      await submitDocuments({ documents: uploadedDocuments });
      showSuccess('تم إرسال المستندات بنجاح');
      navigate('/verification');
    } catch (error) {
      showError('حدث خطأ في إرسال المستندات');
    }
  };

  const handleBack = () => {
    navigate('/verification');
  };

  const getRequiredDocumentsCount = () => {
    return uploadedDocuments.filter(doc => 
      doc.type === 'national-id' || doc.type === 'certificate'
    ).length;
  };

  const getOptionalDocumentsCount = () => {
    return uploadedDocuments.filter(doc => 
      doc.type === 'experience' || doc.type === 'portfolio'
    ).length;
  };

  const canSubmit = () => {
    const requiredDocs = uploadedDocuments.filter(doc => 
      doc.type === 'national-id' || doc.type === 'certificate'
    );
    return requiredDocs.length >= 2 && !documentsLoading;
  };

  if (documentsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">رفع المستندات</h1>
            <p className="text-gray-600">
              ارفع الوثائق المطلوبة لإكمال عملية التحقق
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">تقدم رفع المستندات</h2>
            <Badge variant="info">
              {uploadedDocuments.length} ملف مرفوع
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">المستندات المطلوبة</h3>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                {getRequiredDocumentsCount()}/2 مرفوع
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((getRequiredDocumentsCount() / 2) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">مستندات إضافية</h3>
              </div>
              <p className="text-sm text-green-700 mb-2">
                {getOptionalDocumentsCount()} ملف إضافي
              </p>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getOptionalDocumentsCount() * 25, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Component */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <DocumentUpload
            onDocumentsChange={handleDocumentsChange}
            onComplete={handleComplete}
          />
        </div>

        {/* Uploaded Documents Summary */}
        {uploadedDocuments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص المستندات المرفوعة</h3>
            <div className="space-y-3">
              {uploadedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{document.name}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(document.uploadedAt).toLocaleDateString('ar-SA')} • 
                        {(document.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {document.status === 'approved' && (
                      <Badge variant="success">مقبول</Badge>
                    )}
                    {document.status === 'rejected' && (
                      <Badge variant="error">مرفوض</Badge>
                    )}
                    {document.status === 'pending' && (
                      <Badge variant="warning">قيد المراجعة</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">تعليمات مهمة</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• تأكد من وضوح جميع المستندات المرفوعة</li>
                <li>• المستندات المطلوبة: الهوية الوطنية + شهادة أو مؤهل</li>
                <li>• المستندات الإضافية: شهادات خبرة، معرض أعمال (اختياري)</li>
                <li>• الحد الأقصى لحجم الملف: 10MB</li>
                <li>• الأنواع المدعومة: JPG, PNG, PDF</li>
                <li>• يمكنك حذف وإعادة رفع أي مستند قبل الإرسال</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            رجوع
          </Button>
          
          <div className="flex items-center gap-3">
            {isComplete && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">تم رفع جميع المستندات المطلوبة</span>
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              loading={documentsLoading}
            >
              إرسال المستندات
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DocumentUploadPage; 