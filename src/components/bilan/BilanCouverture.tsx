/**
 * BilanCouverture — une page imprimable par élève.
 * Reproduit fidèlement la mise en page du PDF "Bilan des Acquis Scolaires".
 */
import React from 'react';
import type { Student } from '../../types';
import { CAREER_GRID } from './bilanData';

interface BilanCouvertureProps {
  student: Student;
  schoolYear: string;
}

/** Formate la date ISO → JJ/MM/AAAA */
function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR');
}

export function BilanCouverture({ student, schoolYear }: BilanCouvertureProps) {
  const fullName = `${student.lastName} ${student.firstName}`.toUpperCase();

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 15mm 10mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11pt',
        color: '#000',
        background: '#fff',
        pageBreakAfter: 'always',
        boxSizing: 'border-box',
      }}
    >
      {/* ── EN-TÊTE ── */}
      <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
        {/* Logo placeholder */}
        <div style={{
          width: '20mm', height: '20mm',
          margin: '0 auto 4mm',
          border: '2px solid #1a3a6b',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9pt', color: '#1a3a6b', fontWeight: 'bold',
        }}>
          LOGO
        </div>
        <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1a3a6b', letterSpacing: '1px' }}>
          COLLÈGE PRIVÉ SULLY
        </div>
        <div style={{ fontSize: '9pt', color: '#555', marginTop: '2mm' }}>
          Excellence • Discipline • Réussite
        </div>
        <div style={{ fontSize: '8pt', color: '#555', marginTop: '1mm' }}>
          Antananarivo — Madagascar
        </div>
      </div>

      {/* ── TITRE ── */}
      <div style={{
        textAlign: 'center',
        fontSize: '16pt',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        margin: '6mm 0 8mm',
        borderTop: '2px solid #1a3a6b',
        borderBottom: '2px solid #1a3a6b',
        padding: '3mm 0',
        color: '#1a3a6b',
      }}>
        Bilan des Acquis Scolaires de l'Élève
      </div>

      {/* ── INFOS ÉLÈVE ── */}
      <div style={{
        border: '2px dashed #333',
        borderRadius: '3mm',
        padding: '5mm 8mm',
        margin: '0 0 8mm',
        lineHeight: '2',
      }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>Nom de l'élève&nbsp;: </span>
          <span style={{ color: '#1a3a6b', fontWeight: 'bold', fontSize: '12pt' }}>{fullName}</span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Né(e) le&nbsp;: </span>
          <span style={{ color: '#1a3a6b', fontWeight: 'bold' }}>{formatDate(student.dateOfBirth)}</span>
        </div>
        {student.birthCity && (
          <div>
            <span style={{ fontWeight: 'bold' }}>à&nbsp;: </span>
            <span style={{ color: '#1a3a6b' }}>{student.birthCity}</span>
          </div>
        )}
      </div>

      {/* ── GRILLE DE SCOLARITÉ ── */}
      <div style={{ marginBottom: '6mm' }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11pt',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#1a3a6b',
          marginBottom: '3mm',
          borderBottom: '1px solid #1a3a6b',
          paddingBottom: '1mm',
        }}>
          Parcours scolaire
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            {CAREER_GRID.map(({ cycle, classes }) => (
              <tr key={cycle}>
                {/* Numéro de cycle */}
                <td style={{
                  width: '22mm',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  fontWeight: 'bold',
                  fontSize: '10pt',
                  borderRight: '1px solid #bbb',
                  paddingRight: '3mm',
                  color: '#1a3a6b',
                }}>
                  Cycle {cycle}
                </td>

                {/* Cellules de classe */}
                {classes.map((cls) => {
                  const isCurrent = cls === student.grade;
                  return (
                    <td key={cls} style={{ padding: '2mm 2mm' }}>
                      <div style={{
                        border: isCurrent ? '2.5px solid #1a3a6b' : '1.5px solid #aaa',
                        borderRadius: '2mm',
                        padding: '2mm',
                        background: isCurrent ? '#e8eef7' : '#fafafa',
                        textAlign: 'center',
                      }}>
                        {/* Nom de la classe */}
                        <div style={{
                          fontWeight: isCurrent ? 'bold' : 'normal',
                          fontSize: isCurrent ? '11pt' : '10pt',
                          color: isCurrent ? '#1a3a6b' : '#444',
                          marginBottom: '1.5mm',
                        }}>
                          {cls.replace('EME', 'ème')}
                        </div>

                        {/* Année scolaire */}
                        <div style={{
                          border: '1px solid ' + (isCurrent ? '#1a3a6b' : '#ccc'),
                          borderRadius: '1mm',
                          padding: '1mm 0',
                          fontSize: '8pt',
                          minWidth: '22mm',
                          color: isCurrent ? '#1a3a6b' : '#999',
                          fontWeight: isCurrent ? 'bold' : 'normal',
                        }}>
                          {isCurrent ? schoolYear : '20_ / 20_'}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SIGNATURES ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12mm',
        paddingTop: '4mm',
        borderTop: '1px solid #ccc',
      }}>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '12mm' }}>
            Signature des Parents
          </div>
          <div style={{ borderBottom: '1px solid #333', marginTop: '8mm' }} />
        </div>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '12mm' }}>
            Le Chef d'Établissement
          </div>
          <div style={{ borderBottom: '1px solid #333', marginTop: '8mm' }} />
        </div>
      </div>
    </div>
  );
}
