import React from 'react';

interface ReportCardFooterProps {
  observation?: string;
  teacherName: string;
  mention?: 'félicitations' | 'encouragements' | 'progrès' | 'manque';
}

export function ReportCardFooter({ observation, teacherName, mention }: ReportCardFooterProps) {
  return (
    <div className="report-card-footer">
      <div className="footer-content">
        <div className="observation">
          <table>
            <tbody>
              <tr>
                <th>Observation du conseil de classe</th>
              </tr>
              <tr>
                <td className="obs">{observation}</td>
              </tr>
              <tr>
                <th>Professeur Principal</th>
              </tr>
              <tr>
                <td>{teacherName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mentions">
          <div className="form-check">
            <input
              type="radio"
              name="mention"
              checked={mention === 'félicitations'}
              readOnly
            />
            <label>Félicitations</label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              name="mention"
              checked={mention === 'encouragements'}
              readOnly
            />
            <label>Encouragements</label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              name="mention"
              checked={mention === 'progrès'}
              readOnly
            />
            <label>Doit progresser</label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              name="mention"
              checked={mention === 'manque'}
              readOnly
            />
            <label>Manque de travail</label>
          </div>
        </div>

        <div className="signatures">
          <p className="text-center">Visa du chef d'établissement ou de son délégué</p>
          <br />
          <p className="text-center">Signature des parents</p>
        </div>
      </div>
    </div>
  );
}