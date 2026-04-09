import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Stockage en mémoire — on n'écrit sur disque qu'après traitement
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 Mo max
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Seules les images sont acceptées.'));
    } else {
      cb(null, true);
    }
  },
});

// ─── POST /api/camera/remove-bg ──────────────────────────────────────────────

router.post('/remove-bg', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucune image reçue.' });

  const apiKey = process.env.REMOVEBG_API_KEY;
  const filename = `photo_${Date.now()}`;
  const skipBg = req.query.skip === '1';

  // ── Pas de clé API OU skip demandé : on renvoie l'image originale ──────────
  if (!apiKey || skipBg) {
    const outName = `${filename}.jpg`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), req.file.buffer);
    return res.json({
      url: `/uploads/${outName}`,
      bgRemoved: false,
      warning: 'REMOVEBG_API_KEY non configurée — fond non supprimé.',
    });
  }

  // ── Appel remove.bg ──────────────────────────────────────────────────────
  try {
    const form = new FormData();
    form.append(
      'image_file',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      'photo.jpg',
    );
    form.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`remove.bg ${response.status}: ${text}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const outName = `${filename}.png`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);

    return res.json({ url: `/uploads/${outName}`, bgRemoved: true });
  } catch (err) {
    console.error('[camera] remove-bg error:', err.message);
    // Fallback : renvoie l'original sans fond supprimé
    const outName = `${filename}_orig.jpg`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), req.file.buffer);
    return res.status(200).json({
      url: `/uploads/${outName}`,
      bgRemoved: false,
      warning: `Suppression du fond échouée : ${err.message}`,
    });
  }
});

export default router;
