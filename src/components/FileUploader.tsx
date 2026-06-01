import React, { useRef, useState } from 'react';
import { Upload, X, File, Image, Loader2 } from 'lucide-react';
import { uploadFile } from '../data/supabaseService';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  bucket: 'startup-media' | 'startup-docs';
  folder: string;
  accept?: string;
  label?: string;
  onUpload: (url: string, file: File) => void;
  className?: string;
  currentUrl?: string;
  onClear?: () => void;
}

export default function FileUploader({
  bucket, folder, accept = '*/*', label = 'Enviar Arquivo',
  onUpload, className, currentUrl, onClear
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setProgress(30);

    try {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}.${ext}`;
      setProgress(60);
      const url = await uploadFile(bucket, path, file);
      setProgress(100);
      onUpload(url, file);
    } catch (err: any) {
      setError(err.message || 'Falha no upload. Tente novamente.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isImage = accept.includes('image');

  return (
    <div className={className}>
      {currentUrl ? (
        <div className="relative group">
          {isImage ? (
            <img src={currentUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-gray-100" />
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <File className="w-6 h-6 text-fox shrink-0" />
              <span className="text-sm font-medium text-graphite truncate">{currentUrl.split('/').pop()}</span>
            </div>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="absolute top-2 right-2 bg-white/90 text-red-500 hover:bg-red-50 p-1.5 rounded-full shadow-sm border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            isDragging ? "border-fox bg-fox/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50",
            isUploading && "opacity-70 pointer-events-none"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-fox animate-spin" />
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-fox h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-gray-500 font-medium">Enviando...</span>
            </>
          ) : (
            <>
              {isImage ? <Image className="w-8 h-8 text-gray-300" /> : <Upload className="w-8 h-8 text-gray-300" />}
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">Clique ou arraste o arquivo aqui</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
