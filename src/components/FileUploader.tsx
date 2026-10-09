import React, { useRef, useState } from 'react';
import { FileVideo, Image as ImageIcon, Sparkles, Upload } from 'lucide-react';

interface FileUploaderProps {
  accept: string;
  mediaType: 'image' | 'video';
  onFileSelected: (file: File) => void;
  onSampleSelected?: (sampleUrl: string, sampleName: string) => void;
  samples?: { name: string; url: string; description: string }[];
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  mediaType,
  onFileSelected,
  onSampleSelected,
  samples = [],
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full">
            {mediaType === 'image' ? (
              <ImageIcon className="w-6 h-6" />
            ) : (
              <FileVideo className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & Drop your {mediaType} file here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              or <span className="text-sky-600 dark:text-sky-400 underline font-medium">browse from your computer</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {mediaType === 'image'
              ? 'Supports JPG, JPEG, PNG, WEBP'
              : 'Supports MP4, WEBM (H.264 / VP8 / VP9)'}
          </p>
        </div>
      </div>

      {/* Built-in sample assets for immediate testing */}
      {samples.length > 0 && onSampleSelected && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Or try ready-to-test sample scenes:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {samples.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => onSampleSelected(sample.url, sample.name)}
                className="flex flex-col items-start p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-lg text-left transition-all group"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                  {sample.name}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {sample.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
