import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  User,
  FileText,
  Image,
  Video,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useApi } from '../../../hooks/useApi';
import Button from '../../ui/Button';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import FormTextarea from '../../ui/FormTextarea';
import Badge from '../../ui/Badge';

interface Evidence {
  _id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedBy: {
    _id: string;
    name: { first: string; last: string };
    email: string;
    avatarUrl?: string;
  };
  uploadedAt: Date;
  context: {
    type: 'verification' | 'dispute' | 'complaint' | 'review';
    referenceId: string;
    description: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reviewedBy?: {
    _id: string;
    name: { first: string; last: string };
  };
  reviewedAt?: Date;
  reviewNotes?: string;
  tags: string[];
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
}

interface EvidenceReviewSystemProps {
  className?: string;
}

const EVIDENCE_TYPES = [
  { value: 'all', label: 'جميع الأنواع' },
  { value: 'image', label: 'صور' },
  { value: 'video', label: 'فيديوهات' },
  { value: 'document', label: 'مستندات' }
];

const CONTEXT_TYPES = [
  { value: 'all', label: 'جميع السياقات' },
  { value: 'verification', label: 'التحقق' },
  { value: 'dispute', label: 'النزاعات' },
  { value: 'complaint', label: 'الشكاوى' },
  { value: 'review', label: 'التقييمات' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'pending', label: 'في الانتظار' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'approved', label: 'مقبول' },
  { value: 'rejected', label: 'مرفوض' }
];

const EvidenceReviewSystem: React.FC<EvidenceReviewSystemProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterContext, setFilterContext] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch evidence data
  const { data: evidenceData, isLoading: evidenceLoading } = useApi('/admin/evidence');

  useEffect(() => {
    if (evidenceData) {
      setEvidenceList(evidenceData);
    }
  }, [evidenceData]);

  const handleViewEvidence = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowViewer(true);
    setZoom(1);
    setRotation(0);
    setIsPlaying(false);
  };

  const handleApproveEvidence = async (evidence: Evidence) => {
    try {
      const response = await fetch(`/api/admin/evidence/${evidence._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'approved',
          reviewNotes: 'تم قبول الأدلة'
        })
      });

      if (response.ok) {
        showToast('تم قبول الأدلة بنجاح', 'success');
        // Update local state
        setEvidenceList(prev => prev.map(e => 
          e._id === evidence._id 
            ? { ...e, status: 'approved', reviewedBy: { _id: user?._id || '', name: { first: user?.name?.first || '', last: user?.name?.last || '' } }, reviewedAt: new Date() }
            : e
        ));
      } else {
        showToast('خطأ في قبول الأدلة', 'error');
      }
    } catch (error) {
      showToast('خطأ في قبول الأدلة', 'error');
    }
  };

  const handleRejectEvidence = async (evidence: Evidence) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/evidence/${evidence._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'rejected',
          reviewNotes: reason
        })
      });

      if (response.ok) {
        showToast('تم رفض الأدلة بنجاح', 'success');
        // Update local state
        setEvidenceList(prev => prev.map(e => 
          e._id === evidence._id 
            ? { ...e, status: 'rejected', reviewedBy: { _id: user?._id || '', name: { first: user?.name?.first || '', last: user?.name?.last || '' } }, reviewedAt: new Date(), reviewNotes: reason }
            : e
        ));
      } else {
        showToast('خطأ في رفض الأدلة', 'error');
      }
    } catch (error) {
      showToast('خطأ في رفض الأدلة', 'error');
    }
  };

  const handleDownloadEvidence = async (evidence: Evidence) => {
    try {
      const response = await fetch(evidence.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('تم بدء التحميل', 'success');
    } catch (error) {
      showToast('خطأ في تحميل الملف', 'error');
    }
  };

  const filteredEvidence = evidenceList.filter(evidence => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        evidence.filename.toLowerCase().includes(searchLower) ||
        evidence.uploadedBy.name.first.toLowerCase().includes(searchLower) ||
        evidence.uploadedBy.name.last.toLowerCase().includes(searchLower) ||
        evidence.uploadedBy.email.toLowerCase().includes(searchLower) ||
        evidence.context.description.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && evidence.type !== filterType) return false;

    // Context filter
    if (filterContext !== 'all' && evidence.context.type !== filterContext) return false;

    // Status filter
    if (filterStatus !== 'all' && evidence.status !== filterStatus) return false;

    return true;
  });

  // Sort evidence
  const sortedEvidence = [...filteredEvidence].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'uploadedAt':
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      case 'filename':
        comparison = a.filename.localeCompare(b.filename);
        break;
      case 'uploadedBy':
        comparison = `${a.uploadedBy.name.first} ${a.uploadedBy.name.last}`.localeCompare(`${b.uploadedBy.name.first} ${b.uploadedBy.name.last}`);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5 text-blue-600" />;
      case 'video': return <Video className="w-5 h-5 text-purple-600" />;
      case 'document': return <FileText className="w-5 h-5 text-green-600" />;
      default: return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'under_review': return 'text-blue-600 bg-blue-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'under_review': return 'قيد المراجعة';
      case 'approved': return 'مقبول';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const getContextLabel = (context: string) => {
    switch (context) {
      case 'verification': return 'التحقق';
      case 'dispute': return 'النزاعات';
      case 'complaint': return 'الشكاوى';
      case 'review': return 'التقييمات';
      default: return context;
    }
  };

  if (evidenceLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الأدلة...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-deep-teal">مراجعة الأدلة</h1>
            <p className="text-gray-600">مراجعة وإدارة الأدلة المقدمة من المستخدمين</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">
              {evidenceList.length} دليل
            </Badge>
            <Badge variant="warning">
              {evidenceList.filter(e => e.status === 'pending').length} في الانتظار
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <FormInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="البحث في الأدلة..."
              className="w-full"
            />
          </div>
          <FormSelect
            value={filterType}
            onChange={setFilterType}
            options={EVIDENCE_TYPES}
            placeholder="نوع الدليل"
          />
          <FormSelect
            value={filterContext}
            onChange={setFilterContext}
            options={CONTEXT_TYPES}
            placeholder="سياق الدليل"
          />
          <FormSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={STATUS_OPTIONS}
            placeholder="حالة الدليل"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-gray-600">ترتيب حسب:</span>
          <FormSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'uploadedAt', label: 'تاريخ الرفع' },
              { value: 'filename', label: 'اسم الملف' },
              { value: 'uploadedBy', label: 'المستخدم' },
              { value: 'status', label: 'الحالة' },
              { value: 'size', label: 'الحجم' }
            ]}
            className="w-48"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          </Button>
        </div>
      </div>

      {/* Evidence List */}
      <div className="space-y-4">
        {sortedEvidence.map((evidence) => (
          <div key={evidence._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getEvidenceIcon(evidence.type)}
                <div>
                  <h3 className="font-semibold text-deep-teal">
                    {evidence.filename}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(evidence.size)} • {evidence.mimeType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="primary" 
                  className={`text-sm ${getStatusColor(evidence.status)}`}
                >
                  {getStatusLabel(evidence.status)}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {getContextLabel(evidence.context.type)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">المستخدم:</h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    {evidence.uploadedBy.avatarUrl ? (
                      <img 
                        src={evidence.uploadedBy.avatarUrl} 
                        alt={`${evidence.uploadedBy.name.first} ${evidence.uploadedBy.name.last}`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {evidence.uploadedBy.name.first} {evidence.uploadedBy.name.last}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">تاريخ الرفع:</h4>
                <div className="text-sm text-gray-600">
                  {new Date(evidence.uploadedAt).toLocaleDateString('ar-EG')}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">الوصف:</h4>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {evidence.context.description}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">العلامات:</h4>
                <div className="flex flex-wrap gap-1">
                  {evidence.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="info" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {evidence.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{evidence.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {evidence.reviewNotes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">ملاحظات المراجعة:</h4>
                <p className="text-sm text-gray-600">{evidence.reviewNotes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleViewEvidence(evidence)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  عرض
                </Button>
                <Button
                  onClick={() => handleDownloadEvidence(evidence)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
              </div>

              {evidence.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveEvidence(evidence)}
                    size="sm"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    قبول
                  </Button>
                  <Button
                    onClick={() => handleRejectEvidence(evidence)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض
                  </Button>
                </div>
              )}

              {evidence.reviewedBy && (
                <div className="text-sm text-gray-500">
                  مراجع بواسطة: {evidence.reviewedBy.name.first} {evidence.reviewedBy.name.last}
                  {evidence.reviewedAt && (
                    <span> في {new Date(evidence.reviewedAt).toLocaleDateString('ar-EG')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sortedEvidence.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد أدلة</h3>
            <p className="text-gray-600">
              لم يتم العثور على أدلة تطابق معايير البحث
            </p>
          </div>
        )}
      </div>

      {/* Evidence Viewer Modal */}
      {showViewer && selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-deep-teal">
                {selectedEvidence.filename}
              </h3>
              <div className="flex items-center gap-2">
                {/* Viewer Controls */}
                {selectedEvidence.type === 'image' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(zoom - 0.25, 0.25))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation(rotation + 90)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {selectedEvidence.type === 'video' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewer(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {selectedEvidence.type === 'image' && (
                <div className="flex justify-center">
                  <img
                    src={selectedEvidence.url}
                    alt={selectedEvidence.filename}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  />
                </div>
              )}

              {selectedEvidence.type === 'video' && (
                <div className="flex justify-center">
                  <video
                    src={selectedEvidence.url}
                    controls
                    autoPlay={isPlaying}
                    muted={isMuted}
                    className="max-w-full max-h-full"
                  />
                </div>
              )}

              {selectedEvidence.type === 'document' && (
                <div className="flex justify-center">
                  <iframe
                    src={selectedEvidence.url}
                    title={selectedEvidence.filename}
                    className="w-full h-96 border-0"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceReviewSystem; 