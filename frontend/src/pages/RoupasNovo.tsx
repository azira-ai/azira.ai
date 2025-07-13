// src/pages/RoupasNovo.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Camera, ImagePlus, X } from "lucide-react";

/* botões estilo AZIRA */
const primaryBtn =
  "flex items-center justify-center py-3 w-full rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white font-medium animate-gradient-pan";
const secondaryBtn =
  "flex items-center justify-center py-3 w-full rounded-full border border-gray-300 text-gray-700";

export default function RoupasNovo() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // associa o stream ao vídeo assim que estiver disponível
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // inicia câmera
  const startCamera = async () => {
    if (stream) return;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(media);
    } catch (err) {
      console.error(err);
      alert("Não foi possível acessar a câmera.");
    }
  };

  // captura foto do vídeo
  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) setPreview(URL.createObjectURL(blob));
    });
    stopCamera();
  };

  // para câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const save = () => {
    if (!preview) return;
    alert("Foto registrada! (mock)");
    navigate(-1);
  };

  const cancel = () => {
    stopCamera();
    navigate(-1);
  };

  // limpa stream ao desmontar
  useEffect(() => () => stopCamera(), []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      <main className="flex flex-col justify-between flex-1 px-6 pt-20 pb-24">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-6">Registrar Nova Peça</h2>

          {/* Quadradinho de preview aumentado para w-56 h-56 */}
          <div className="w-56 h-56 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden mb-6">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="object-cover w-full h-full"
              />
            ) : preview ? (
              <img
                src={preview}
                alt="preview"
                className="object-contain w-full h-full"
              />
            ) : (
              <span className="text-gray-300">Sem imagem</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
            {!stream ? (
              <button onClick={startCamera} className={secondaryBtn}>
                <Camera className="w-5 h-5 mr-2" />
                <span>Tirar Foto</span>
              </button>
            ) : (
              <button onClick={capture} className={secondaryBtn}>
                <Camera className="w-5 h-5 mr-2" />
                <span>Capturar</span>
              </button>
            )}

            <button
              onClick={() => galleryRef.current?.click()}
              className={secondaryBtn}
            >
              <ImagePlus className="w-5 h-5 mr-2" />
              <span>Galeria</span>
            </button>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <button
            disabled={!preview}
            onClick={save}
            className={`${primaryBtn} ${
              !preview ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Salvar
          </button>
          <button
            onClick={cancel}
            className={`${secondaryBtn} flex items-center justify-center gap-2`}
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </main>

      <BottomNav />

      <style jsx global>{`
        @keyframes gradient-pan {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-pan {
          background-size: 200% 200%;
          animation: gradient-pan 4s linear infinite;
        }
      `}</style>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
