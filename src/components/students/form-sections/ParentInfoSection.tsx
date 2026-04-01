import React from 'react';
import { Phone } from 'lucide-react';
import type { ParentInfo } from '../../../types';
import { FR } from '../../../constants/translations';

interface ParentInfoSectionProps {
  data: ParentInfo;
  onUpdate: (updates: Partial<ParentInfo>) => void;
}

export function ParentInfoSection({ data, onUpdate }: ParentInfoSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">{FR.students.parentInfo}</h3>
      
      {/* Father Information */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">{FR.students.fatherInfo}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {FR.students.fatherName}
            </label>
            <input
              type="text"
              required
              value={data.fatherName}
              onChange={(e) => onUpdate({ fatherName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {FR.students.fatherOccupation}
            </label>
            <input
              type="text"
              required
              value={data.fatherOccupation}
              onChange={(e) => onUpdate({ fatherOccupation: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.fatherPhone}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={16} className="text-gray-400" />
            </div>
            <input
              type="tel"
              required
              value={data.fatherPhone}
              onChange={(e) => onUpdate({ fatherPhone: e.target.value })}
              className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="034 00 000 00"
            />
          </div>
        </div>
      </div>

      {/* Mother Information */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">{FR.students.motherInfo}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {FR.students.motherName}
            </label>
            <input
              type="text"
              required
              value={data.motherName}
              onChange={(e) => onUpdate({ motherName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {FR.students.motherOccupation}
            </label>
            <input
              type="text"
              required
              value={data.motherOccupation}
              onChange={(e) => onUpdate({ motherOccupation: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.motherPhone}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={16} className="text-gray-400" />
            </div>
            <input
              type="tel"
              required
              value={data.motherPhone}
              onChange={(e) => onUpdate({ motherPhone: e.target.value })}
              className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="034 00 000 00"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">{FR.students.contactInfo}</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.email}
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.address}
          </label>
          <textarea
            required
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}