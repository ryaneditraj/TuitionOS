'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';

interface LightboxPhoto {
  id: string;
  photo_url: string;
  title: string;
  caption?: string;
  subject_name?: string;
  date?: string;
}

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: LightboxPhoto[];
  initialIndex?: number;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

export default function LightboxModal({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
  canDelete = false,
  onDelete,
}: LightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setZoomLevel(1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div 
        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{currentPhoto.title}</span>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} of {photos.length} {currentPhoto.subject_name ? `• ${currentPhoto.subject_name}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <a
            href={currentPhoto.photo_url}
            download
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-slate-200"
            title="Download Full Resolution"
          >
            <Download className="w-5 h-5" />
          </a>
          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (confirm('Delete this board photo?')) {
                  onDelete(currentPhoto.id);
                  onClose();
                }
              }}
              className="p-2 rounded-full hover:bg-rose-500/30 text-rose-400 transition-colors"
              title="Delete Photo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.photo_url}
          alt={currentPhoto.title}
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-h-[80vh] max-w-[90vw] object-contain transition-transform duration-150 rounded-lg shadow-2xl cursor-grab"
        />

        {/* Prev / Next buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Caption footer */}
      {currentPhoto.caption && (
        <div 
          className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-slate-300 max-w-lg mx-auto">{currentPhoto.caption}</p>
        </div>
      )}
    </div>
  );
}
