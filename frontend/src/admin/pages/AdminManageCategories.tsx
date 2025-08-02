import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Folder } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/UI/Modal';
import Pagination from '../components/UI/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Breadcrumb from '../components/UI/Breadcrumb';
import { FormInput, FormTextarea } from '../../components/ui';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import Button from '../../components/ui/Button';
import SortableTable, { SortDirection } from '../components/UI/SortableTable';

const CATEGORIES_API = '/api/categories';
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

interface Subcategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  createdAt: string | Date;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  createdAt: string | Date;
  subcategories: Subcategory[];
}

interface CategoriesApiResponse {
  categories: Category[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Utility to map backend category to frontend
function mapCategory(raw: unknown): Category {
  if (typeof raw !== 'object' || raw === null) throw new Error('Invalid category object');
  const obj = raw as Record<string, unknown>;
  return {
    id: String(obj._id || obj.id),
    name: String(obj.name),
    description: String(obj.description),
    icon: String(obj.icon),
    isActive: Boolean(obj.isActive),
    createdAt: String(obj.createdAt),
    subcategories: Array.isArray(obj.subcategories) 
      ? obj.subcategories.map((sub: Record<string, unknown>) => ({
          id: String(sub._id || sub.id),
          name: String(sub.name),
          description: String(sub.description || ''),
          icon: String(sub.icon || ''),
          isActive: Boolean(sub.isActive),
          createdAt: String(sub.createdAt),
        }))
      : [],
  };
}

const fetchCategories = async ({ page }: { page: number; }): Promise<CategoriesApiResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  const res = await fetch(`${CATEGORIES_API}?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('فشل تحميل الفئات');
  const raw = await res.json();
  // Debug log
  console.debug('[fetchCategories] token:', null, 'response:', raw);
  return {
    ...raw.data,
    categories: (raw.data.categories || []).map(mapCategory),
    totalPages: raw.data.totalPages || 1,
    totalItems: raw.data.totalItems || 0,
    itemsPerPage: raw.data.itemsPerPage || 10,
  };
};

const addCategory = async (data: { name: string; description: string; icon: string }, token: string | null) => {
  console.debug('[addCategory] token:', token, 'payload:', data);
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل إضافة الفئة');
  return res.json();
};

const editCategory = async (id: string, data: { name: string; description: string; icon: string }, token: string | null) => {
  console.debug('[editCategory] token:', token, 'id:', id, 'payload:', data);
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل تعديل الفئة');
  return res.json();
};

const deleteCategory = async (id: string, token: string | null) => {
  console.debug('[deleteCategory] token:', token, 'id:', id);
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('فشل حذف الفئة');
  return res.json();
};

// Subcategory API functions
const addSubcategory = async (categoryId: string, data: { name: string; description: string }, token: string | null) => {
  console.debug('[addSubcategory] token:', token, 'categoryId:', categoryId, 'payload:', data);
  const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل إضافة الفئة الفرعية');
  return res.json();
};

const editSubcategory = async (categoryId: string, subcategoryId: string, data: { name: string; description: string }, token: string | null) => {
  console.debug('[editSubcategory] token:', token, 'categoryId:', categoryId, 'subcategoryId:', subcategoryId, 'payload:', data);
  const res = await fetch(`/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل تعديل الفئة الفرعية');
  return res.json();
};

const deleteSubcategory = async (categoryId: string, subcategoryId: string, token: string | null) => {
  console.debug('[deleteSubcategory] token:', token, 'categoryId:', categoryId, 'subcategoryId:', subcategoryId);
  const res = await fetch(`/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('فشل حذف الفئة الفرعية');
  return res.json();
};

const AdminManageCategories: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isSubcategoryDeleteModalOpen, setIsSubcategoryDeleteModalOpen] = useState(false);
  const [isSubcategoriesViewModalOpen, setIsSubcategoriesViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [subcategoryFormErrors, setSubcategoryFormErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [iconUploadLoading, setIconUploadLoading] = useState(false);
  const [iconUploadError, setIconUploadError] = useState('');
  const [sortKey, setSortKey] = useState<keyof Category>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: { name: string; description: string; icon: string }) => addCategory(data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('تم إضافة الفئة بنجاح');
    },
    onError: (error) => {
      showError('فشل إضافة الفئة', error.message);
    },
  });
  
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string; icon: string } }) => editCategory(id, data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('تم تعديل الفئة بنجاح');
    },
    onError: (error) => {
      showError('فشل تعديل الفئة', error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('تم حذف الفئة بنجاح');
    },
    onError: (error) => {
      showError('فشل حذف الفئة', error.message);
    },
  });

  // Subcategory mutations
  const addSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: { name: string; description: string } }) => 
      addSubcategory(categoryId, data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('تم إضافة الفئة الفرعية بنجاح');
    },
    onError: (error) => {
      showError('فشل إضافة الفئة الفرعية', error.message);
    },
  });

  const editSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, subcategoryId, data }: { categoryId: string; subcategoryId: string; data: { name: string; description: string } }) => 
      editSubcategory(categoryId, subcategoryId, data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('تم تعديل الفئة الفرعية بنجاح');
    },
    onError: (error) => {
      showError('فشل تعديل الفئة الفرعية', error.message);
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, subcategoryId }: { categoryId: string; subcategoryId: string }) => 
      deleteSubcategory(categoryId, subcategoryId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('تم حذف الفئة الفرعية بنجاح');
    },
    onError: (error) => {
      showError('فشل حذف الفئة الفرعية', error.message);
    },
  });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<CategoriesApiResponse, Error>({
    queryKey: ['categories', currentPage],
    queryFn: () => fetchCategories({ page: currentPage }),
  });

  const categories = data?.categories || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || 0;
  const itemsPerPage = data?.itemsPerPage || 10;

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '', icon: '' });
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon
    });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleViewSubcategories = (category: Category) => {
    setSelectedCategory(category);
    setIsSubcategoriesViewModalOpen(true);
  };

  const handleAddSubcategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSubcategoryFormData({ name: '', description: '' });
    setIsSubcategoryModalOpen(true);
  };

  const handleEditSubcategory = (category: Category, subcategory: Subcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      description: subcategory.description
    });
    setIsSubcategoryModalOpen(true);
  };

  const handleDeleteSubcategory = (category: Category, subcategory: Subcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setIsSubcategoryDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'اسم الفئة مطلوب';
    }
    if (!formData.description.trim()) {
      errors.description = 'وصف الفئة مطلوب';
    }
    if (!formData.icon.trim()) {
      errors.icon = 'رابط الأيقونة مطلوب';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSubcategoryForm = () => {
    const errors: Record<string, string> = {};
    if (!subcategoryFormData.name.trim()) {
      errors.name = 'اسم الفئة الفرعية مطلوب';
    }
    if (!subcategoryFormData.description.trim()) {
      errors.description = 'وصف الفئة الفرعية مطلوب';
    }
    setSubcategoryFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (selectedCategory) {
      editMutation.mutate({ id: selectedCategory.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
    setIsModalOpen(false);
    setFormData({ name: '', description: '', icon: '' });
    setFormErrors({});
  };

  const handleSubcategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSubcategoryForm() || !selectedCategory) return;
    
    if (selectedSubcategory) {
      editSubcategoryMutation.mutate({ 
        categoryId: selectedCategory.id, 
        subcategoryId: selectedSubcategory.id, 
        data: subcategoryFormData 
      });
    } else {
      addSubcategoryMutation.mutate({ 
        categoryId: selectedCategory.id, 
        data: subcategoryFormData 
      });
    }
    setIsSubcategoryModalOpen(false);
    setSubcategoryFormData({ name: '', description: '' });
    setSubcategoryFormErrors({});
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  const confirmSubcategoryDelete = () => {
    if (selectedCategory && selectedSubcategory) {
      deleteSubcategoryMutation.mutate({ 
        categoryId: selectedCategory.id, 
        subcategoryId: selectedSubcategory.id 
      });
    }
    setIsSubcategoryDeleteModalOpen(false);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  // ImgBB upload handler
  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconUploadError('');
    setIconUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'فشل رفع الصورة');
      }
      setFormData(prev => ({ ...prev, icon: data.data.url }));
    } catch {
      setIconUploadError('فشل رفع الصورة. الرجاء المحاولة مرة أخرى.');
    }
    setIconUploadLoading(false);
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'اسم الفئة',
      sortable: true,
      className: 'text-right w-1/3',
      render: (value: unknown, category: Record<string, unknown>) => {
        const cat = category as unknown as Category;
        return (
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-deep-teal" />
            <span className="font-medium text-deep-teal text-right">{String(value)}</span>
            <span className="text-xs text-gray-500">({cat.subcategories.length})</span>
          </div>
        );
      }
    },
    {
      key: 'description',
      label: 'الوصف',
      sortable: false,
      className: 'text-right w-1/3',
      render: (value: unknown) => <span className="text-soft-teal text-right">{String(value)}</span>
    },
    {
      key: 'icon',
      label: 'الأيقونة',
      sortable: false,
      className: 'text-right w-20',
      render: (value: unknown, category: Record<string, unknown>) => {
        const cat = category as unknown as Category;
        return (
          <img src={String(value)} alt={`${cat.name} Icon`} className="h-10 w-10 rounded-full object-cover" />
        );
      }
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      sortable: false,
      className: 'text-center w-1/3',
      render: (_: unknown, category: Record<string, unknown>) => {
        const cat = category as unknown as Category;
        return (
          <div className="flex items-center gap-2 justify-center">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleViewSubcategories(cat)} 
              leftIcon={<Plus className="h-3 w-3 mr-1" />}
            >
              الفئات الفرعية
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleEditCategory(cat)} 
              leftIcon={<Edit2 className="h-3 w-3 mr-1" />}
            >
              تعديل
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => handleDeleteCategory(cat)} 
              leftIcon={<Trash2 className="h-3 w-3 mr-1" />}
            >
              حذف
            </Button>
          </div>
        );
      }
    }
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[300px] text-lg text-deep-teal">جاري التحميل...</div>
  );
  
  if (isError) return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'إدارة الفئات' }]} />
      <h1 className="text-3xl font-bold text-deep-teal">إدارة الفئات</h1>
      <div className="text-center py-8 text-red-600">{(error as Error).message}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'إدارة الفئات' }]} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-deep-teal">إدارة الفئات</h1>
        <Button variant="secondary" onClick={handleAddCategory} leftIcon={<Plus className="h-5 w-5 mr-1" />}>
          إضافة فئة جديدة
        </Button>
      </div>
      <div className="bg-light-cream rounded-2xl shadow-md overflow-hidden p-8">
        <SortableTable
          data={categories as unknown as Record<string, unknown>[]}
          columns={tableColumns}
          onSort={(key, direction) => {
            setSortKey(key as keyof Category);
            setSortDirection(direction);
          }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          emptyMessage={isLoading ? 'جاري التحميل...' : isError ? (error as Error).message : 'لا توجد فئات'}
          className="mt-8"
        />
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="اسم الفئة"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسم الفئة"
            error={formErrors.name}
            required
          />
          
          <FormTextarea
            label="وصف الفئة"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="أدخل وصف الفئة"
            rows={3}
            error={formErrors.description}
            required
          />

          {/* Icon file upload */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">أيقونة الفئة (JPG, PNG)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleIconFileChange}
              disabled={iconUploadLoading}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bright-orange file:text-white hover:file:bg-orange-600"
              title="اختر أيقونة الفئة"
              aria-label="أيقونة الفئة"
            />
            {iconUploadLoading && <div className="text-xs text-deep-teal mt-1">جاري رفع الصورة...</div>}
            {iconUploadError && <div className="text-xs text-red-600 mt-1">{iconUploadError}</div>}
            {formData.icon && (
              <div className="mt-2 flex items-center gap-2">
                <img src={formData.icon} alt="معاينة الأيقونة" className="h-12 w-12 rounded-full object-cover border" />
                <span className="text-xs text-gray-500 break-all">{formData.icon}</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">سيتم رفع الصورة إلى ImgBB واستخدام الرابط مباشرة</div>
            {formErrors.icon && <div className="text-xs text-red-600 mt-1">{formErrors.icon}</div>}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => {
              setIsModalOpen(false);
              setFormErrors({});
            }}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={addMutation.isPending || editMutation.isPending || iconUploadLoading}
            >
              {addMutation.isPending || editMutation.isPending ? 'جاري...' : (selectedCategory ? 'تعديل' : 'إضافة')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Subcategories Modal */}
      <Modal
        isOpen={isSubcategoriesViewModalOpen}
        onClose={() => setIsSubcategoriesViewModalOpen(false)}
        title={`الفئات الفرعية - ${selectedCategory?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-deep-teal">الفئات الفرعية</h3>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleAddSubcategory(selectedCategory!)}
              leftIcon={<Plus className="h-3 w-3 mr-1" />}
            >
              إضافة فئة فرعية
            </Button>
          </div>
          
          {selectedCategory?.subcategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد فئات فرعية</p>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleAddSubcategory(selectedCategory!)}
                className="mt-2"
                leftIcon={<Plus className="h-3 w-3 mr-1" />}
              >
                إضافة فئة فرعية جديدة
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedCategory?.subcategories.map(subcategory => (
                <div key={subcategory.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-deep-teal">{subcategory.name}</h4>
                    <p className="text-sm text-gray-600">{subcategory.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditSubcategory(selectedCategory!, subcategory)} 
                      leftIcon={<Edit2 className="h-3 w-3 mr-1" />}
                    >
                      تعديل
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteSubcategory(selectedCategory!, subcategory)} 
                      leftIcon={<Trash2 className="h-3 w-3 mr-1" />}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Add/Edit Subcategory Modal */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={selectedSubcategory ? 'تعديل الفئة الفرعية' : 'إضافة فئة فرعية جديدة'}
      >
        <form onSubmit={handleSubcategorySubmit} className="space-y-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">الفئة الرئيسية: <span className="font-medium text-deep-teal">{selectedCategory?.name}</span></p>
          </div>
          
          <FormInput
            label="اسم الفئة الفرعية"
            value={subcategoryFormData.name}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
            placeholder="أدخل اسم الفئة الفرعية"
            error={subcategoryFormErrors.name}
            required
          />
          
          <FormTextarea
            label="وصف الفئة الفرعية"
            value={subcategoryFormData.description}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
            placeholder="أدخل وصف الفئة الفرعية"
            rows={3}
            error={subcategoryFormErrors.description}
            required
          />

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => {
              setIsSubcategoryModalOpen(false);
              setSubcategoryFormErrors({});
            }}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={addSubcategoryMutation.isPending || editSubcategoryMutation.isPending}
            >
              {addSubcategoryMutation.isPending || editSubcategoryMutation.isPending ? 'جاري...' : (selectedSubcategory ? 'تعديل' : 'إضافة')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={confirmDelete}
        title="حذف الفئة"
        message={`هل أنت متأكد من حذف الفئة "${selectedCategory?.name}"؟ هذا الإجراء سيحذف جميع الفئات الفرعية أيضاً ولا يمكن التراجع عنه.`}
        confirmText="حذف"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Delete Subcategory Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSubcategoryDeleteModalOpen}
        onClose={() => {
          setIsSubcategoryDeleteModalOpen(false);
          setSelectedCategory(null);
          setSelectedSubcategory(null);
        }}
        onConfirm={confirmSubcategoryDelete}
        title="حذف الفئة الفرعية"
        message={`هل أنت متأكد من حذف الفئة الفرعية "${selectedSubcategory?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        type="danger"
        isLoading={deleteSubcategoryMutation.isPending}
      />
    </div>
  );
};

export default AdminManageCategories;