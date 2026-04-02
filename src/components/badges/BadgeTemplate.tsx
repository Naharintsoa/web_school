import type { Student } from '../../types';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface BadgeTemplateProps {
  student: Student;
}

/** Reproduction exacte du template Twig single badge */
export function BadgeTemplate({ student }: BadgeTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <>
      <div style={{
        height: '6.8cm',
        padding: '8px',
        border: '2px double #000',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
        }}>

          {/* badge-content */}
          <div style={{ flex: 1, marginRight: '10px' }}>
            {/* Logo : cercle avec initiale (remplace l'image établissement) */}
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#1a5fa8,#2097bf)',
              border: '2px solid #c8d8ea',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', fontFamily: 'serif' }}>C</span>
            </div>
            <br />
            COLLÈGE PRIVÉ SULLY<br />
            {student.schoolYear || currentYear}<br /><br />
            Matricule : <span style={{ color: '#007BFF', fontWeight: 'bold' }}>{student.matricule || '—'}</span><br />
            Prénoms : <span style={{ color: '#007BFF', fontWeight: 'bold' }}>{student.firstName || '—'}</span><br />
            Classe : <span style={{ color: '#007BFF', fontWeight: 'bold' }}>{student.grade || '—'}</span>
          </div>

          {/* photo-frame */}
          <div style={{
            width: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#555',
            border: '1px solid #ccc',
            overflow: 'hidden',
            borderRadius: '4px',
          }}>
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt="photo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  imageRendering: 'auto',
                  display: 'block',
                }}
              />
            ) : (
              <span style={{ padding: '8px', textAlign: 'center' }}>
                {(student.firstName?.[0] ?? '').toUpperCase()}
                {(student.lastName?.[0] ?? '').toUpperCase()}
              </span>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @media print { .bdg-no-break { page-break-inside: avoid; } }
      `}</style>
    </>
  );
}
