/**
 * Templates Twig par défaut pour chaque type de document.
 * Variables disponibles :
 *   student.firstName, student.lastName, student.matricule, student.grade
 *   student.dateOfBirth, student.enrollmentDate, student.photoUrl
 *   student.issNumber, student.schoolYear
 *   student.parentInfo.fatherName, student.parentInfo.motherName
 *   schoolYear  — année scolaire courante
 *   today       — date du jour (fr-FR)
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_DEFAULT = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 8px; }
  .badge-item {
    height: 6.8cm;
    padding: 8px;
    border: 2px double #000;
    box-sizing: border-box;
    width: 100%;
  }
  .badge-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .badge-info { flex: 1; margin-right: 10px; }
  .badge-logo {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a5fa8, #2097bf);
    border: 2px solid #c8d8ea;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 6px;
  }
  .badge-logo-text { color: #fff; font-size: 32px; font-weight: bold; font-family: serif; }
  .badge-photo {
    width: 100px; min-height: 85px;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: #555;
    text-align: center;
  }
  .badge-photo img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .blue { color: #007BFF; font-weight: bold; }
  @media print { .badge-item { page-break-inside: avoid; } }
</style>
</head>
<body>
<div class="badge-item">
  <div class="badge-row">
    <div class="badge-info">
      <div class="badge-logo">
        <span class="badge-logo-text">C</span>
      </div>
      COLLÈGE PRIVÉ SULLY<br>
      {{ schoolYear }}<br><br>
      Matricule : <span class="blue">{{ student.matricule }}</span><br>
      Prénoms : <span class="blue">{{ student.firstName }}</span><br>
      Classe : <span class="blue">{{ student.grade }}</span>
    </div>
    <div class="badge-photo">
      {% if student.photoUrl %}
        <img src="{{ student.photoUrl }}" alt="photo">
      {% else %}
        <span style="padding: 8px;">
          {{ student.firstName|slice(0, 1)|upper }}{{ student.lastName|slice(0, 1)|upper }}
        </span>
      {% endif %}
    </div>
  </div>
</div>
</body>
</html>`;

// ─── Certificat de Scolarité ──────────────────────────────────────────────────

const CERTIFICAT_SCOLARITE_DEFAULT = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12px; margin: 0; padding: 0; }
  .page {
    width: 20cm; min-height: 14cm;
    border: 5px solid #09438a;
    border-radius: 10px;
    background: #ffffff;
    padding: 0;
    box-sizing: border-box;
    margin: 25px;
  }
  .header {
    display: flex;
    align-items: center;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #e0e0e0;
  }
  .school-name {
    font-size: 18px; font-weight: bold;
    color: #09438a; text-transform: uppercase;
    margin-bottom: 4px;
  }
  .school-info { font-size: 10px; line-height: 1.4; color: #333; }
  .title {
    text-align: center; font-weight: bold;
    font-size: 13px; color: #09438a;
    margin: 10px 0 8px;
    text-transform: uppercase;
  }
  .body { padding: 0 50px; }
  .intro { font-size: 12px; margin-bottom: 8px; }
  ul { margin: 4px 0; padding-left: 1cm; font-size: 12px; line-height: 1.5; }
  ul li { margin-bottom: 1px; }
  strong { color: #09438a; }
  .signature { text-align: right; margin-right: 20px; margin-top: 12px; padding-bottom: 12px; }
  @media print {
    body, html { overflow: hidden; }
    .page { page-break-before: always; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="text-align: center; flex-grow: 1;">
      <div class="school-name">COLLEGE PRIVE SULLY</div>
      <div class="school-info">
        Lot IV A 16 bis Ambodivonkely Ambohimanarina<br>
        Tél : <strong>020 85 234 94</strong> — <strong>034 16 351 52</strong> | Email : <strong>sully@moov.mg</strong><br>
        CISCO Antananarivo Ville Code : <strong>101 011 793 ZAP VI</strong><br>
        AO N° 036/2019 - DRENETP/ANALA/AO du 21/11/19
      </div>
    </div>
  </div>

  <div class="title">CERTIFICAT DE SCOLARITÉ {{ schoolYear }}</div>

  <div class="body">
    <p class="intro">
      Je soussignée, <strong>RAMANANIRAINY Norotahiana</strong>, Directrice nominale de l'école SULLY,
      certifie sur l'honneur que l'élève :
    </p>

    <ul>
      <li><strong>Nom :</strong> {{ student.lastName }}</li>
      <li><strong>Prénoms :</strong> {{ student.firstName }}</li>
      <li><strong>Né(e) le :</strong> {{ student.dateOfBirth }}</li>
      <li><strong>À :</strong> Antananarivo</li>
      <li><strong>Fils/Fille de :</strong> {{ student.parentInfo.fatherName }}</li>
      <li><strong>Et de :</strong> {{ student.parentInfo.motherName }}</li>
    </ul>

    <p style="font-size:12px;"><strong>Est élève dans mon établissement</strong></p>
    <p style="font-size:12px;"><strong>Depuis le :</strong> {{ student.enrollmentDate }}</p>
    <p style="font-size:12px;"><strong>Classe actuelle :</strong> {{ student.grade }}</p>
    <p style="font-size:12px;"><strong>Numéro matricule :</strong> {{ student.matricule }}</p>

    <p style="text-align:center; font-size:12px; margin-top:10px;">
      Ce certificat lui est délivré pour servir et valoir ce que de droit.
    </p>
  </div>

  <div class="signature">
    <p style="font-size:10px;">Antananarivo, le {{ today }}</p>
    <p style="margin-top:40px; font-size:12px; font-weight:bold;">RAMANANIRAINY Norotahiana</p>
  </div>
</div>
</body>
</html>`;

// ─── Certificat de Radiation ──────────────────────────────────────────────────

const CERTIFICAT_RADIATION_DEFAULT = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12px; margin: 0; padding: 0; }
  .page {
    width: 20cm; min-height: 14cm;
    border: 5px solid #09438a;
    border-radius: 10px;
    background: #ffffff;
    padding: 0;
    box-sizing: border-box;
    margin: 25px;
  }
  .header {
    display: flex;
    align-items: center;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #e0e0e0;
  }
  .school-name {
    font-size: 18px; font-weight: bold;
    color: #09438a; text-transform: uppercase;
    margin-bottom: 4px;
  }
  .school-info { font-size: 10px; line-height: 1.4; color: #333; }
  .title {
    text-align: center; font-weight: bold;
    font-size: 13px; color: #09438a;
    margin: 10px 0 8px;
    text-transform: uppercase;
  }
  .body { padding: 0 50px; }
  .intro { font-size: 12px; margin-bottom: 8px; }
  ul { margin: 4px 0; padding-left: 1cm; font-size: 12px; line-height: 1.5; }
  ul li { margin-bottom: 1px; }
  strong { color: #09438a; }
  .signature { text-align: right; margin-right: 20px; margin-top: 12px; padding-bottom: 12px; }
  @media print {
    body, html { overflow: hidden; }
    .page { page-break-before: always; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="text-align: center; flex-grow: 1;">
      <div class="school-name">COLLEGE PRIVE SULLY</div>
      <div class="school-info">
        Lot IV A 16 bis Ambodivonkely Ambohimanarina<br>
        Tél : <strong>020 85 234 94</strong> — <strong>034 16 351 52</strong> | Email : <strong>sully@moov.mg</strong><br>
        CISCO Antananarivo Ville Code : <strong>101 011 793 ZAP VI</strong><br>
        AO N° 036/2019 - DRENETP/ANALA/AO du 21/11/19
      </div>
    </div>
  </div>

  <div class="title">CERTIFICAT DE RADIATION {{ schoolYear }}</div>

  <div class="body">
    <p class="intro">
      Je soussignée, <strong>RAMANANIRAINY Norotahiana</strong>, Directrice nominale de l'école SULLY,
      certifie que l'élève ci-dessous a quitté l'établissement :
    </p>

    <ul>
      <li><strong>Nom :</strong> {{ student.lastName }}</li>
      <li><strong>Prénoms :</strong> {{ student.firstName }}</li>
      <li><strong>Né(e) le :</strong> {{ student.dateOfBirth }}</li>
      <li><strong>À :</strong> Antananarivo</li>
      <li><strong>Fils/Fille de :</strong> {{ student.parentInfo.fatherName }}</li>
      <li><strong>Et de :</strong> {{ student.parentInfo.motherName }}</li>
    </ul>

    <p style="font-size:12px;"><strong>A été élève dans mon établissement</strong></p>
    <p style="font-size:12px;"><strong>Depuis le :</strong> {{ student.enrollmentDate }}</p>
    <p style="font-size:12px;"><strong>Dernière classe :</strong> {{ student.grade }}</p>
    <p style="font-size:12px;"><strong>Numéro matricule :</strong> {{ student.matricule }}</p>

    <p style="text-align:center; font-size:12px; margin-top:10px;">
      Ce certificat de radiation lui est délivré pour servir et valoir ce que de droit.
    </p>
  </div>

  <div class="signature">
    <p style="font-size:10px;">Antananarivo, le {{ today }}</p>
    <p style="margin-top:40px; font-size:12px; font-weight:bold;">RAMANANIRAINY Norotahiana</p>
  </div>
</div>
</body>
</html>`;

// ─── Certificat d'Identité ────────────────────────────────────────────────────

const CERTIFICAT_IDENTITE_DEFAULT = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 11px; margin: 0; padding: 8px; }
  .card-wrapper {
    width: 98mm; min-height: 135mm;
    padding: 3mm; box-sizing: border-box;
  }
  .card-border {
    width: 100%;
    border: 1.5mm double #2097bf;
    padding: 3.5mm;
    box-sizing: border-box;
    display: flex; flex-direction: column; gap: 2.5mm;
    min-height: 128mm;
  }
  .card-header { display: flex; align-items: flex-start; gap: 3mm; }
  .photo-box {
    width: 28mm; height: 35mm;
    border: 0.3mm solid #000;
    flex-shrink: 0; background: #f9f9f9;
    overflow: hidden;
  }
  .photo-box img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
  .card-title {
    flex: 1; text-align: center; padding-top: 2mm;
    line-height: 1.5; color: #09448a; font-size: 11.5px;
  }
  .divider { border-top: 0.2mm solid #2097bf; margin: 1mm 0; }
  .info-table { width: 100%; border-collapse: collapse; }
  .info-table td { padding: 0.5mm 1mm; vertical-align: top; }
  .info-label { font-weight: bold; white-space: nowrap; width: 30%; color: #222; }
  .info-value { font-weight: bold; }
  .blue { color: #2097bf; }
  .red { color: #cc0000; }
  .vacc-table { border-collapse: collapse; flex: 1; }
  .vacc-table td { border: 0.3mm solid #000; width: 12mm; height: 6mm; padding: 0; }
  .signatures {
    display: flex; justify-content: space-between;
    margin-top: auto; padding-top: 10mm;
    font-size: 10px; text-align: center;
  }
  .signatures div { flex: 1; text-align: center; font-style: italic; color: #444; }
  @media print { .card-wrapper { page-break-inside: avoid; } }
</style>
</head>
<body>
<div class="card-wrapper">
  <div class="card-border">

    <div class="card-header">
      <div class="photo-box">
        {% if student.photoUrl %}
          <img src="{{ student.photoUrl }}" alt="photo">
        {% endif %}
      </div>
      <div class="card-title">
        <strong>CARTE D'IDENTITÉ SCOLAIRE</strong><br>
        <strong>COLLÈGE PRIVÉ SULLY</strong><br>
        <strong>Année scolaire {{ schoolYear }}</strong>
      </div>
    </div>

    <div class="divider"></div>

    <div>
      <p style="margin:0;line-height:1.4;">
        Je, <strong>RAMANANIRAINY Norotahiana</strong>, certifie que
      </p>
      <table class="info-table">
        <tbody>
          <tr>
            <td class="info-label">Nom :</td>
            <td class="info-value blue">{{ student.lastName|upper }}</td>
          </tr>
          <tr>
            <td class="info-label">Prénoms :</td>
            <td class="info-value blue">{{ student.firstName }}</td>
          </tr>
          <tr>
            <td class="info-label">Né(e) le :</td>
            <td class="info-value blue">{{ student.dateOfBirth }}</td>
          </tr>
          <tr>
            <td class="info-label">N° Matricule :</td>
            <td class="info-value blue">{{ student.matricule }}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin:1mm 0 0;line-height:1.4;">
        {{ student.lastName|upper }} {{ student.firstName }} est élève dans mon établissement.
      </p>
      <div style="display:flex;gap:2mm;margin-top:1mm;">
        <span class="info-label">N° Matricule ISS :</span>
        <span class="info-value red">{{ student.issNumber }}</span>
      </div>
    </div>

    <div style="display:flex;align-items:flex-start;gap:3mm;margin-top:1mm;">
      <div style="width:45%;font-weight:bold;line-height:2;white-space:nowrap;font-size:10.5px;">
        <div>Primo vaccination</div>
        <div>Revaccination</div>
      </div>
      <table class="vacc-table">
        <tbody>
          <tr><td></td><td></td></tr>
          <tr><td></td><td></td></tr>
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div>Signature et cachet</div>
      <div>Cachet I.S.S</div>
      <div>Signature de l'élève</div>
    </div>

  </div>
</div>
</body>
</html>`;

// ─── Export ───────────────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'badge',
    name: 'Badge',
    description: 'Badge élève avec photo, matricule et classe',
    code: BADGE_DEFAULT,
  },
  {
    id: 'certificat-scolarite',
    name: 'Certificat de scolarité',
    description: "Atteste qu'un élève est inscrit dans l'établissement",
    code: CERTIFICAT_SCOLARITE_DEFAULT,
  },
  {
    id: 'certificat-radiation',
    name: 'Certificat de radiation',
    description: "Atteste qu'un élève a quitté l'établissement",
    code: CERTIFICAT_RADIATION_DEFAULT,
  },
  {
    id: 'certificat-identite',
    name: "Certificat d'identité",
      description: "Carte d'identité scolaire avec photo et informations élève",
    code: CERTIFICAT_IDENTITE_DEFAULT,
  },
];

export const getDefaultTemplate = (id: string): DocumentTemplate | undefined =>
  DEFAULT_TEMPLATES.find((t) => t.id === id);
