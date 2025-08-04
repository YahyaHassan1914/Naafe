import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Layout from '../../components/layout/Layout';
import CreateRequestForm from '../../components/requests/CreateRequestForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { serviceRequestService } from '../../services';

const CreateServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { useCreateServiceRequest } = useApi();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createRequestMutation = useCreateServiceRequest();

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Upload images first if any
      let uploadedImages: string[] = [];
      if (formData.images && formData.images.length > 0) {
        uploadedImages = await Promise.all(
          formData.images.map((file: File) => 
            serviceRequestService.uploadImages([file])
          )
        );
      }

      // Create the service request
      const requestData = {
        ...formData,
        images: uploadedImages
      };

      const result = await createRequestMutation.mutateAsync(requestData);
      
      if (result) {
        // Navigate to the created request
        navigate(`/requests/${result._id}`, { 
          replace: true,
          state: { 
            message: 'تم إنشاء طلب الخدمة بنجاح!',
            type: 'success'
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to create service request:', error);
      alert(error?.message || 'حدث خطأ أثناء إنشاء طلب الخدمة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 space-x-reverse mb-4">
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-text-primary">
              إنشاء طلب خدمة جديد
            </h1>
          </div>
          <p className="text-text-secondary">
            املأ النموذج أدناه لإنشاء طلب خدمة جديد. سيتم عرض طلبك للمزودين المؤهلين.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isSubmitting ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" text="جاري إنشاء طلب الخدمة..." />
            </div>
          ) : (
            <CreateRequestForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            💡 نصائح لإنشاء طلب ناجح
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3 space-x-reverse">
                <span className="text-blue-600 text-lg">📝</span>
                <div>
                  <h4 className="font-medium text-blue-800">اكتب وصفاً مفصلاً</h4>
                  <p className="text-sm text-blue-700">
                    كلما كان الوصف أكثر تفصيلاً، كلما كان من السهل على المزودين فهم متطلباتك وتقديم عروض دقيقة.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-x-reverse">
                <span className="text-blue-600 text-lg">💰</span>
                <div>
                  <h4 className="font-medium text-blue-800">حدد ميزانية واقعية</h4>
                  <p className="text-sm text-blue-700">
                    حدد ميزانية مناسبة للخدمة المطلوبة. الميزانية المنخفضة جداً قد لا تجذب مزودين جيدين.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 space-x-reverse">
                <span className="text-blue-600 text-lg">📅</span>
                <div>
                  <h4 className="font-medium text-blue-800">حدد موعداً مناسباً</h4>
                  <p className="text-sm text-blue-700">
                    امنح المزودين وقتاً كافياً لإنجاز العمل. المواعيد العاجلة جداً قد تزيد من التكلفة.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-x-reverse">
                <span className="text-blue-600 text-lg">📸</span>
                <div>
                  <h4 className="font-medium text-blue-800">أضف صور توضيحية</h4>
                  <p className="text-sm text-blue-700">
                    الصور تساعد المزودين على فهم المشكلة أو المتطلبات بشكل أفضل وتؤدي إلى عروض أكثر دقة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            ❓ الأسئلة الشائعة
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-text-primary mb-2">
                كم من الوقت يستغرق ظهور طلبي للمزودين؟
              </h4>
              <p className="text-sm text-text-secondary">
                يظهر طلبك فوراً للمزودين المؤهلين في منطقتك. عادةً ما تبدأ العروض في الوصول خلال ساعات قليلة.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-text-primary mb-2">
                هل يمكنني تعديل طلبي بعد نشره؟
              </h4>
              <p className="text-sm text-text-secondary">
                نعم، يمكنك تعديل طلبك طالما لم يتم قبول أي عرض بعد. الطلبات المفتوحة فقط قابلة للتعديل.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-text-primary mb-2">
                ماذا لو لم أتلق أي عروض؟
              </h4>
              <p className="text-sm text-text-secondary">
                إذا لم تتلق عروضاً خلال 48 ساعة، قد ترغب في مراجعة ميزانيتك أو وصف الطلب لجعله أكثر جاذبية.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateServiceRequestPage; 