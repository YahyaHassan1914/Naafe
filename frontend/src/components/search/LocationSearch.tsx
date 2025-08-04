import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/UnifiedSelect';
import { EGYPT_GOVERNORATES, EGYPT_CITIES } from '../../utils/constants';

interface Location {
  governorate: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSearchProps {
  location: Location;
  onLocationChange: (location: Location) => void;
  onClearLocation?: () => void;
  className?: string;
  disabled?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  location,
  onLocationChange,
  onClearLocation,
  className = '',
  disabled = false
}) => {
  const [localLocation, setLocalLocation] = useState(location);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    setLocalLocation(location);
  }, [location]);

  const handleLocationChange = (field: keyof Location, value: any) => {
    const newLocation = { ...localLocation, [field]: value };

    if (field === 'governorate') {
      newLocation.city = '';
    }

    setLocalLocation(newLocation);
  };

  const handleApplyLocation = () => {
    onLocationChange(localLocation);
  };

  const handleClearLocation = () => {
    const clearedLocation: Location = {
      governorate: '',
      city: '',
      latitude: undefined,
      longitude: undefined
    };
    setLocalLocation(clearedLocation);
    onClearLocation?.();
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocalLocation(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('فشل في تحديد موقعك الحالي');
        setIsLoadingLocation(false);
      }
    );
  };

  const hasLocation = location.governorate || location.city;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 space-x-reverse">
        <MapPin className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-text-primary">
          تحديد الموقع
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            المحافظة
          </label>
          <UnifiedSelect
            value={localLocation.governorate}
            onChange={(value) => handleLocationChange('governorate', value)}
            options={[
              { value: '', label: 'اختر المحافظة' },
              ...EGYPT_GOVERNORATES.map(gov => ({ value: gov.name, label: gov.name }))
            ]}
            placeholder="اختر المحافظة"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            المدينة
          </label>
          <UnifiedSelect
            value={localLocation.city}
            onChange={(value) => handleLocationChange('city', value)}
            options={[
              { value: '', label: 'اختر المدينة' },
              ...(localLocation.governorate ? 
                EGYPT_CITIES[localLocation.governorate]?.map(city => ({ value: city, label: city })) || []
                : []
              )
            ]}
            placeholder="اختر المدينة"
            disabled={disabled || !localLocation.governorate}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 space-x-reverse">
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          disabled={disabled || isLoadingLocation}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <Navigation className="w-4 h-4" />
          <span>{isLoadingLocation ? 'جاري التحديد...' : 'تحديد موقعي الحالي'}</span>
        </Button>

        {hasLocation && (
          <Button
            variant="outline"
            onClick={handleClearLocation}
            disabled={disabled}
            className="text-red-600 hover:text-red-700"
          >
            مسح الموقع
          </Button>
        )}
      </div>

      {(localLocation.latitude || localLocation.longitude) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">الإحداثيات المحددة:</h4>
          <p className="text-sm text-blue-700">
            خط العرض: {localLocation.latitude?.toFixed(6)}<br />
            خط الطول: {localLocation.longitude?.toFixed(6)}
          </p>
        </div>
      )}

      <div className="flex space-x-2 space-x-reverse">
        <Button
          variant="outline"
          onClick={() => setLocalLocation(location)}
          disabled={disabled}
        >
          إلغاء التغييرات
        </Button>
        <Button
          variant="primary"
          onClick={handleApplyLocation}
          disabled={disabled}
        >
          تطبيق الموقع
        </Button>
      </div>
    </div>
  );
};

export default LocationSearch; 