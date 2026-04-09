/**
 * CameraCapture — prise de photo via la caméra dorsale du téléphone.
 *
 * Étapes :
 *  1. camera  → aperçu vidéo en temps réel (caméra arrière)
 *  2. preview → photo capturée, choix de supprimer le fond ou non
 *  3. processing → envoi au backend, animation d'attente
 *  4. result  → photo traitée sur fond en damier, téléchargement / utilisation
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera, CameraOff, RefreshCw, Download, Check,
  X, Wand2, ImageOff,
} from 'lucide-react';

interface Props {
  onPhotoSelected: (url: string) => void;
  onClose: () => void;
}

type Step = 'camera' | 'preview' | 'processing' | 'result';

export function CameraCapture({ onPhotoSelected, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep]           = useState<Step>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl]   = useState('');
  const [resultUrl, setResultUrl]       = useState('');
  const [bgRemoved, setBgRemoved]       = useState(false);
  const [warning, setWarning]           = useState('');
  const [error, setError]               = useState('');
  const [removeBg, setRemoveBg]         = useState(true);

  // ── Caméra ───────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres du navigateur.");
      } else if (err.name === 'NotFoundError') {
        setError("Aucune caméra détectée sur cet appareil.");
      } else {
        setError(`Impossible d'accéder à la caméra : ${err.message ?? err.name}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  // ── Capture ──────────────────────────────────────────────────────────────

  const handleCapture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      stopCamera();
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
      setStep('preview');
    }, 'image/jpeg', 0.92);
  };

  // ── Traitement ───────────────────────────────────────────────────────────

  const handleProcess = async () => {
    if (!capturedBlob) return;
    setStep('processing');
    setWarning('');
    setError('');

    try {
      const form = new FormData();
      form.append('image', capturedBlob, 'photo.jpg');

      const res = await fetch('/api/camera/remove-bg', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');

      setResultUrl(data.url);
      setBgRemoved(data.bgRemoved ?? false);
      if (data.warning) setWarning(data.warning);
      setStep('result');
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors du traitement.');
      setStep('preview');
    }
  };

  // Sans suppression de fond : on envoie quand même pour avoir une URL serveur stable
  const handleSkipBg = async () => {
    if (!capturedBlob) return;
    setStep('processing');
    setWarning('');
    setError('');

    try {
      const form = new FormData();
      form.append('image', capturedBlob, 'photo.jpg');

      // On envoie avec un header indiquant de ne pas supprimer le fond
      // (le backend renvoie toujours l'original si pas de clé API, sinon on triche ici)
      const res = await fetch('/api/camera/remove-bg?skip=1', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');

      setResultUrl(data.url);
      setBgRemoved(false);
      setStep('result');
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors du traitement.');
      setStep('preview');
    }
  };

  // ── Recommencer ──────────────────────────────────────────────────────────

  const retake = async () => {
    setCapturedBlob(null);
    setCapturedUrl('');
    setResultUrl('');
    setWarning('');
    setError('');
    setBgRemoved(false);
    setStep('camera');
    await startCamera();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = bgRemoved ? 'photo_eleve.png' : 'photo_eleve.jpg';
    a.click();
  };

  const handleUse = () => {
    onPhotoSelected(resultUrl);
    stopCamera();
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 flex-shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Camera size={18} />
          <span className="text-sm font-semibold">Prise de photo élève</span>
        </div>
        <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white rounded-lg">
          <X size={20} />
        </button>
      </div>

      {/* ── Contenu principal ── */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">

        {/* Vidéo en direct */}
        {step === 'camera' && (
          <>
            {error ? (
              <div className="text-center px-8">
                <CameraOff size={52} className="mx-auto mb-4 text-red-400" />
                <p className="text-sm text-red-300 leading-relaxed">{error}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </>
        )}

        {/* Aperçu capturé */}
        {(step === 'preview' || step === 'processing') && capturedUrl && (
          <img src={capturedUrl} alt="Aperçu" className="max-w-full max-h-full object-contain" />
        )}

        {/* Résultat */}
        {step === 'result' && resultUrl && (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: bgRemoved
                ? 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 24px 24px'
                : '#111',
            }}
          >
            <img src={resultUrl} alt="Photo traitée" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
          </div>
        )}

        {/* Overlay traitement */}
        {step === 'processing' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">
              {removeBg ? 'Suppression du fond en cours…' : 'Envoi en cours…'}
            </p>
            <p className="text-gray-400 text-xs">Veuillez patienter</p>
          </div>
        )}

        {/* Canvas caché */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* ── Barre d'actions ── */}
      <div className="bg-black/90 px-4 pt-4 pb-6 flex-shrink-0 space-y-3">

        {/* Avertissement non-bloquant */}
        {warning && (
          <p className="text-amber-400 text-xs text-center bg-amber-900/30 rounded-lg px-3 py-2">
            {warning}
          </p>
        )}
        {error && step !== 'camera' && (
          <p className="text-red-400 text-xs text-center bg-red-900/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* ─ Étape : caméra ─ */}
        {step === 'camera' && !error && (
          <div className="flex flex-col items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={removeBg}
                onChange={e => setRemoveBg(e.target.checked)}
                className="accent-indigo-500 w-4 h-4"
              />
              <span className="text-sm text-gray-200">Supprimer l'arrière-plan</span>
            </label>

            {/* Bouton déclencheur */}
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center shadow-lg"
              aria-label="Prendre photo"
            >
              <Camera size={32} className="text-gray-800" />
            </button>
            <p className="text-xs text-gray-500">Appuyer pour capturer</p>
          </div>
        )}

        {/* ─ Étape : aperçu ─ */}
        {step === 'preview' && (
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={retake}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm"
            >
              <RefreshCw size={15} />
              Reprendre
            </button>

            {removeBg ? (
              <button
                onClick={handleProcess}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
              >
                <Wand2 size={15} />
                Supprimer le fond
              </button>
            ) : (
              <button
                onClick={handleSkipBg}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
              >
                <Check size={15} />
                Utiliser cette photo
              </button>
            )}
          </div>
        )}

        {/* ─ Étape : résultat ─ */}
        {step === 'result' && (
          <div className="space-y-3">
            {bgRemoved && (
              <p className="text-green-400 text-xs text-center flex items-center justify-center gap-1.5">
                <Check size={13} />
                Arrière-plan supprimé avec succès
              </p>
            )}
            {!bgRemoved && (
              <p className="text-gray-400 text-xs text-center flex items-center justify-center gap-1.5">
                <ImageOff size={13} />
                Photo originale (fond conservé)
              </p>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={retake}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm"
              >
                <RefreshCw size={15} />
                Reprendre
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm"
              >
                <Download size={15} />
                Télécharger
              </button>
              <button
                onClick={handleUse}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
              >
                <Check size={15} />
                Utiliser comme photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
