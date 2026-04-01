import React from 'react';
import { Camera, Upload } from 'lucide-react';
import { FR } from '../../../constants/translations';

interface PhotoUploadSectionProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string) => void;
}

export function PhotoUploadSection({ currentPhotoUrl, onPhotoChange }: PhotoUploadSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{FR.students.photo}</h3>
      
      <div className="flex items-center space-x-6">
        <div className="relative w-32 h-32">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Photo de profil"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
              <Camera size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload size={16} className="mr-2" />
            {FR.students.uploadPhoto}
          </button>
          <p className="text-xs text-gray-500">{FR.students.photoRequirements}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}