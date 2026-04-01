import React from 'react';
import { Hash, Calendar, Shield } from 'lucide-react';
import type { Student } from '../../../types/student';
import { formatMatricule } from '../../../utils/matricule';
import { FR } from '../../../constants/translations';

interface StudentInfoSectionProps {
  data: Omit<Student, 'id' | 'parentInfo'>;
  onUpdate: (updates: Partial<Omit<Student, 'id' | 'parentInfo'>>) => void;
}

export function StudentInfoSection({ data, onUpdate }: StudentInfoSectionProps) {
  // Format matricule input as user types
  const handleMatriculeChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const truncated = digits.slice(0, 7);
    onUpdate({ matricule: truncated });
  };

  // Validate student number input
  const handleStudentNumberChange = (value: string) => {
    const number = parseInt(value, 10);
    if (!isNaN(number) && number > 0) {
      onUpdate({ studentNumber: number });
    }
  };

  // Format date for input fields
  const formatDateForInput = (date: string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Calculate max date for birth date (today)
  const maxBirthDate = new Date().toISOString().split('T')[0];

  // Calculate min date for birth date (20 years ago)
  const minBirthDate = new Date(
    new Date().setFullYear(new Date().getFullYear() - 20)
  ).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">{FR.students.studentInfo}</h3>
      
      {/* Student Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.studentNumber}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              N°
            </span>
            <input
              type="number"
              min="1"
              value={data.studentNumber || ''}
              onChange={(e) => handleStudentNumberChange(e.target.value)}
              className="block w-full pl-8 pr-4 py-2 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="1"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Numéro de l'élève dans la classe
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.matricule}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <Hash size={16} />
            </span>
            <input
              type="text"
              value={data.matricule || ''}
              onChange={(e) => handleMatriculeChange(e.target.value)}
              className="block w-full pl-8 pr-4 py-2 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="2324001"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Format: AAGGXXX (Année/Grade/Séquence)
          </p>
        </div>
      </div>

      {/* Display formatted matricule if exists */}
      {data.matricule && (
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-sm text-gray-600">
            Matricule formaté: <span className="font-medium">{formatMatricule(data.matricule)}</span>
          </p>
        </div>
      )}

      {/* Numéro ISS */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Numéro ISS
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            <Shield size={16} />
          </span>
          <input
            type="text"
            value={data.issNumber || ''}
            onChange={(e) => onUpdate({ issNumber: e.target.value })}
            className="block w-full pl-9 pr-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Ex : ISS-2024-001"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Numéro I.S.S de l'élève (optionnel)
        </p>
      </div>

      {/* Student Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.firstName}
          </label>
          <input
            type="text"
            required
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.lastName}
          </label>
          <input
            type="text"
            required
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {FR.students.commonName}
        </label>
        <input
          type="text"
          value={data.commonName || ''}
          onChange={(e) => onUpdate({ commonName: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.dateOfBirth}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              required
              value={formatDateForInput(data.dateOfBirth)}
              onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
              min={minBirthDate}
              max={maxBirthDate}
              className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.gender}
          </label>
          <select
            value={data.gender}
            onChange={(e) => onUpdate({ gender: e.target.value as 'male' | 'female' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="male">{FR.students.male}</option>
            <option value="female">{FR.students.female}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.grade}
          </label>
          <input
            type="text"
            readOnly
            value={data.grade}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {FR.students.schoolYear}
          </label>
          <input
            type="text"
            readOnly
            value={data.schoolYear}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {FR.students.enrollmentDate}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar size={16} className="text-gray-400" />
          </div>
          <input
            type="date"
            required
            value={formatDateForInput(data.enrollmentDate)}
            onChange={(e) => onUpdate({ enrollmentDate: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}