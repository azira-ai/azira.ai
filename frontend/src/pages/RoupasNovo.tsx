// src/pages/RoupasNovo.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Camera, ImagePlus, X } from "lucide-react";
import api from "@/lib/api";

/* botões estilo AZIRA */
const primaryBtn =
  "flex items-center justify-center py-3 w-full rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white font-medium animate-gradient-pan";
const secondaryBtn =
  "flex items-center justify-center py-3 w-full rounded-full border border-gray-300 text-gray-700";

export default function RoupasNovo() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    if (stream) return;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(media);
    } catch {
      alert("Não foi possível acessar a câmera.");
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const imgFile = new File([blob], "capture.png", { type: blob.type });
        setFile(imgFile);
        setPreview(URL.createObjectURL(blob));
      }
    });
    stopCamera();
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0];
    if (sel) {
      setFile(sel);
      setPreview(URL.createObjectURL(sel));
    }
  };

  const save = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // recebe o item criado
      const res = await api.post<{ id: string }>("/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // vai para a página de detalhe do novo item
      navigate(`/roupas/${res.data.id}`);
    } catch {
      alert("Erro ao registrar peça. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const cancel = () => {
    stopCamera();
    navigate(-1);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      {uploading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-10">
          <div className="w-16 h-16 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-700 font-medium">Analisando com IA...</p>
        </div>
      )}

      <Header />

      <main className="flex flex-col justify-between flex-1 px-6 pt-20 pb-24">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Registrar Nova Peça
          </h2>

          <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-6 shadow-md">
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
              <span className="text-gray-400">Sem imagem</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
            {!stream ? (
              <button onClick={startCamera} className={secondaryBtn}>
                <Camera className="w-5 h-5 mr-2" />
                Tirar Foto
              </button>
            ) : (
              <button onClick={capture} className={secondaryBtn}>
                <Camera className="w-5 h-5 mr-2" />
                Capturar
              </button>
            )}
            <button
              onClick={() => galleryRef.current?.click()}
              className={secondaryBtn}
            >
              <ImagePlus className="w-5 h-5 mr-2" />
              Galeria
            </button>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <button
            disabled={!file || uploading}
            onClick={save}
            className={`${primaryBtn} ${
              !file || uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Salvar
          </button>
          <button
            onClick={cancel}
            className={`${secondaryBtn} flex items-center justify-center gap-2 ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={uploading}
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
