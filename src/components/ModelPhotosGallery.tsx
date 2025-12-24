import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  Download,
  ExternalLink
} from "lucide-react";

interface ModelPhotosGalleryProps {
  photos: string[] | null | undefined;
  modelName?: string;
}

export function ModelPhotosGallery({ photos, modelName }: ModelPhotosGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-800/30 border border-dashed border-white/10">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Camera className="w-4 h-4" />
          <span className="text-xs">Портфолио фотографий</span>
        </div>
        <p className="text-xs text-slate-500">Модель ещё не загрузила фотографии</p>
      </div>
    );
  }

  const openPhoto = (index: number) => {
    setSelectedIndex(index);
    setIsZoomed(false);
  };

  const closePhoto = () => {
    setSelectedIndex(null);
    setIsZoomed(false);
  };

  const nextPhoto = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setIsZoomed(false);
    }
  };

  const prevPhoto = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setIsZoomed(false);
    }
  };

  const downloadPhoto = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${modelName || 'model'}_photo_${index + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="p-4 rounded-lg bg-slate-800/30 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Camera className="w-4 h-4" />
            <span className="text-xs">Портфолио ({photos.length} фото)</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div 
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-white/10 hover:border-purple-500/50 transition-all"
              onClick={() => openPhoto(index)}
            >
              <img 
                src={photo} 
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closePhoto}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
            onClick={closePhoto}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation */}
          {selectedIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}
          
          {selectedIndex < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Image */}
          <div 
            className={`relative transition-all duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
          >
            <img 
              src={photos[selectedIndex]}
              alt={`Photo ${selectedIndex + 1}`}
              className={`transition-all duration-300 ${
                isZoomed 
                  ? 'max-w-none max-h-none w-auto h-auto' 
                  : 'max-w-[90vw] max-h-[85vh] object-contain'
              }`}
            />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/70 px-4 py-2 rounded-full">
            <span className="text-white text-sm">
              {selectedIndex + 1} / {photos.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={(e) => { 
                e.stopPropagation(); 
                downloadPhoto(photos[selectedIndex], selectedIndex); 
              }}
            >
              <Download className="w-4 h-4 mr-1" />
              Скачать
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={(e) => { 
                e.stopPropagation(); 
                window.open(photos[selectedIndex], '_blank'); 
              }}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Открыть
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
