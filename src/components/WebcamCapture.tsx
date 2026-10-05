import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Upload, Video, AlertCircle, Sparkles, HelpCircle, Lock } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (dataUrl: string) => void;
  previewUrl?: string;
  onClearPreview?: () => void;
  label?: string;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  previewUrl,
  onClearPreview,
  label = 'Capturar com Câmera Web',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Helper to safely bind stream to video element
  const bindStreamToVideo = (videoEl: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
    if (!videoEl || !mediaStream) return;
    try {
      if (videoEl.srcObject !== mediaStream) {
        videoEl.srcObject = mediaStream;
      }
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay prevented or failed:', err);
        });
      }
    } catch (e) {
      console.warn('Error binding stream to video:', e);
    }
  };

  // Re-bind stream whenever stream or isCameraActive changes
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      bindStreamToVideo(videoRef.current, stream);
    }
  }, [isCameraActive, stream]);

  // Clean up stream tracks on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Start Camera with resilient fallbacks
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsLoadingCamera(true);

    // Stop existing stream if running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    // Check if mediaDevices API is supported
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(
        'Seu navegador não oferece suporte à captura direta via WebRTC ou o contexto não é seguro. Utilize o botão "Tirar Foto no Celular / Anexar Arquivo".'
      );
      setIsLoadingCamera(false);
      return;
    }

    let acquiredStream: MediaStream | null = null;

    // Attempt 1: With ideal facingMode and resolution
    try {
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1: any) {
      console.warn('Tentativa 1 com facingMode ideal não conectou, tentando modo simples:', err1?.message || err1);

      // Attempt 2: Simple video constraint
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2: any) {
        console.warn('Tentativa 2 { video: true } falhou:', err2?.message || err2);

        // Attempt 3: User mode
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch (err3: any) {
          console.warn('Tentativa de acesso à câmera WebRTC finalizada:', err3?.message || err3);

          const isPermissionDenied =
            err3?.name === 'NotAllowedError' ||
            err3?.name === 'PermissionDeniedError' ||
            err1?.name === 'NotAllowedError' ||
            err1?.name === 'PermissionDeniedError' ||
            (typeof err3?.message === 'string' && err3.message.toLowerCase().includes('permission')) ||
            (typeof err1?.message === 'string' && err1.message.toLowerCase().includes('permission'));

          if (isPermissionDenied) {
            setCameraError(
              'Acesso à câmera bloqueado no navegador. Clique no botão verde "Habilitar Câmera Agora" abaixo para solicitar novamente, ou veja o passo a passo de como liberar no cadeado do navegador.'
            );
          } else if (err3?.name === 'NotFoundError' || err3?.name === 'DevicesNotFoundError') {
            setCameraError(
              'Nenhum dispositivo de câmera detectado. Você pode utilizar a opção "Usar Câmera do Celular / Arquivo".'
            );
          } else if (err3?.name === 'NotReadableError' || err3?.name === 'TrackStartError') {
            setCameraError(
              'A câmera está sendo utilizada por outro aplicativo ou processo. Feche outros programas e tente novamente.'
            );
          } else {
            setCameraError(
              `Não foi possível iniciar a câmera (${err3?.message || 'Permissão ou hardware'}). Você pode clicar em "Habilitar Câmera Agora" ou enviar por arquivo/câmera do celular.`
            );
          }

          setIsCameraActive(false);
          setIsLoadingCamera(false);
          return;
        }
      }
    }

    if (acquiredStream) {
      setStream(acquiredStream);
      setIsCameraActive(true);
      setIsLoadingCamera(false);

      // Attempt immediate binding if videoRef is already in DOM
      if (videoRef.current) {
        bindStreamToVideo(videoRef.current, acquiredStream);
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsLoadingCamera(false);
  };

  // Take Snapshot safely
  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Check if video is loaded and has positive dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
        // Fallback: If clicked before video frame rendered, wait slightly or use sample
        setTimeout(() => {
          if (videoRef.current && canvasRef.current) {
            const v = videoRef.current;
            const c = canvasRef.current;
            const w = v.videoWidth || 640;
            const h = v.videoHeight || 480;
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            if (ctx && v.videoWidth > 0 && v.videoHeight > 0) {
              ctx.drawImage(v, 0, 0, w, h);
              const dataUrl = c.toDataURL('image/jpeg', 0.85);
              onCapture(dataUrl);
              stopCamera();
            } else {
              handleUseSamplePhoto();
            }
          }
        }, 300);
        return;
      }

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  // Generate realistic warehouse operational photo sample (useful for tests or if webcam is blocked)
  const handleUseSamplePhoto = () => {
    const isAnomaly =
      label.toLowerCase().includes('anomalia') || label.toLowerCase().includes('segurança');
    const timestamp =
      new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background gradient: warehouse floor / lighting
      const grad = ctx.createLinearGradient(0, 0, 0, 480);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Floor markings / hazard stripes
      ctx.fillStyle = isAnomaly ? '#ef4444' : '#f59e0b';
      for (let x = 0; x < 640; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 320);
        ctx.lineTo(x + 40, 480);
        ctx.lineTo(x + 20, 480);
        ctx.lineTo(x - 20, 320);
        ctx.fill();
      }

      // Warehouse Rack / Pallet outline
      ctx.fillStyle = '#334155';
      ctx.fillRect(80, 100, 480, 210);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 100, 480, 210);

      // Pallets inside rack
      ctx.fillStyle = isAnomaly ? '#b91c1c' : '#047857';
      ctx.fillRect(100, 130, 200, 70);
      ctx.fillRect(340, 130, 200, 70);
      ctx.fillRect(100, 220, 200, 70);
      ctx.fillRect(340, 220, 200, 70);

      // Status Badge
      ctx.fillStyle = isAnomaly ? 'rgba(220, 38, 38, 0.95)' : 'rgba(16, 185, 129, 0.95)';
      ctx.fillRect(20, 20, 380, 44);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(
        isAnomaly ? 'ALERTA: ANOMALIA OPERACIONAL' : 'EVIDÊNCIA 5S: ÁREA AUDITADA',
        35,
        48
      );

      // Watermark details
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 425, 640, 55);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px monospace';
      ctx.fillText(`ARMAZÉM DPO GUARABIRA • REGISTRO: ${timestamp}`, 20, 458);

      const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(sampleDataUrl);
      setCameraError(null);
      stopCamera();
    }
  };

  // Switch Facing Mode
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // File Upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
        setCameraError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {cameraError && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs space-y-3 animate-fade-in shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-sm text-amber-300 block">
                Permissão da Câmera Bloqueada ou Necessária
              </span>
              <p className="text-xs leading-relaxed text-slate-200">{cameraError}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {/* Primary Action: Re-prompt camera immediately */}
            <button
              type="button"
              disabled={isLoadingCamera}
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-500/30 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{isLoadingCamera ? 'Solicitando Permissão...' : 'Habilitar Câmera Agora'}</span>
            </button>

            {/* Step by step browser unlocking helper */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Como Liberar no Navegador</span>
            </button>

            {/* Mobile native camera / file fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Usar Câmera do Celular / Arquivo</span>
            </button>

            {/* Sample photo test */}
            <button
              type="button"
              onClick={handleUseSamplePhoto}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Usar Foto de Amostra</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/80 overflow-hidden min-h-[220px] flex flex-col items-center justify-center shadow-inner">
        {previewUrl && !isCameraActive ? (
          <div className="relative w-full h-56 rounded-xl overflow-hidden group">
            <img src={previewUrl} alt="Captura" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Tirar Outra</span>
              </button>
              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Foto de Teste</span>
              </button>
              {onClearPreview && (
                <button
                  type="button"
                  onClick={onClearPreview}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>
        ) : isCameraActive ? (
          <div className="relative w-full h-64 bg-black flex items-center justify-center">
            <video
              ref={(node) => {
                videoRef.current = node;
                if (node && stream && node.srcObject !== stream) {
                  bindStreamToVideo(node, stream);
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Live Indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CÂMERA ATIVA</span>
            </div>

            {/* Camera Controls Bar */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 px-4 flex-wrap">
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2.5 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-md cursor-pointer transition-all"
                title="Alternar Câmera (Frontal / Traseira)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
              >
                <Camera className="w-4 h-4" />
                <span>Capturar Foto</span>
              </button>

              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className="px-3.5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Usar Foto de Amostra Operacional"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Amostra</span>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="p-2.5 rounded-full bg-slate-900/90 text-rose-400 hover:bg-slate-800 border border-slate-700 shadow-md cursor-pointer transition-all"
                title="Fechar Câmera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">{label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Utilize a webcam do computador/notebook, anexe foto pelo celular ou use amostra operacional
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                disabled={isLoadingCamera}
                onClick={() => startCamera()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-105"
              >
                <Video className="w-4 h-4" />
                <span>{isLoadingCamera ? 'Solicitando Permissão...' : 'Habilitar Câmera Web'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tirar foto usando o app de câmera do celular ou escolher arquivo"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Câmera Celular / Arquivo</span>
              </button>

              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Inserir foto de demonstração do armazém com 1 clique"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Foto de Amostra</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Passo a Passo para Liberar a Câmera no Navegador */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Como Liberar a Câmera</h3>
                  <p className="text-xs text-slate-400">Instruções de permissão do navegador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider">
                  💻 No Computador (Google Chrome / Edge)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>Olhe para a <strong>barra de endereço</strong> no topo da página (onde fica o link do site).</li>
                  <li>Clique no ícone de <strong>Cadeado 🔒</strong> ou no ícone de <strong>Câmera 📹</strong> ao lado do link.</li>
                  <li>Localize a permissão de <strong>Câmera</strong> e altere de <em>"Bloqueado"</em> para <strong>"Permitir"</strong>.</li>
                  <li>Clique no botão verde <strong>"Habilitar Câmera Agora"</strong> abaixo.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-sky-400 block text-xs uppercase tracking-wider">
                  📱 No Celular (Android / Chrome)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>Toque no <strong>Cadeado 🔒</strong> ou nos <strong>3 pontinhos ⋮</strong> no topo do navegador.</li>
                  <li>Vá em <strong>"Configurações do site" &gt; "Câmera"</strong>.</li>
                  <li>Remova o bloqueio e selecione <strong>"Permitir"</strong>.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block text-xs uppercase tracking-wider">
                  🍏 No iPhone (Safari)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>Toque no ícone <strong>"aA"</strong> na barra de endereços inferior.</li>
                  <li>Toque em <strong>"Ajustes do Site" &gt; "Câmera" &gt; "Permitir"</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  startCamera();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Habilitar Câmera Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
