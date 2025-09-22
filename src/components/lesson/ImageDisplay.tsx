import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, Eye, Image as ImageIcon } from 'lucide-react';

interface ImageDisplayProps {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  caption?: string;
  type?: 'vocabulary' | 'scenario' | 'illustration' | 'cultural';
  vocabulary?: Array<{
    word: string;
    definition: string;
    position?: { x: number; y: number };
  }>;
}

export const ImageDisplay = ({ 
  src, 
  alt, 
  title, 
  description, 
  caption,
  type = 'illustration',
  vocabulary = []
}: ImageDisplayProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const getTypeColor = () => {
    switch (type) {
      case 'vocabulary': return 'bg-accent/20 text-accent-foreground';
      case 'scenario': return 'bg-primary/20 text-primary-foreground';
      case 'illustration': return 'bg-success/20 text-success-foreground';
      case 'cultural': return 'bg-warning/20 text-warning-foreground';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'vocabulary': return 'Vocabulary';
      case 'scenario': return 'Scenario';
      case 'illustration': return 'Illustration';
      case 'cultural': return 'Cultural Context';
      default: return 'Image';
    }
  };

  return (
    <>
      <Card className="w-full overflow-hidden">
        {(title || description) && (
          <CardHeader className="pb-3">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className={`text-xs ${getTypeColor()}`}>
                <ImageIcon className="w-3 h-3 mr-1" />
                {getTypeLabel()}
              </Badge>
              
              {vocabulary.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVocabulary(!showVocabulary)}
                  className="text-xs h-6"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Vocabulary ({vocabulary.length})
                </Button>
              )}
            </div>
          </CardHeader>
        )}
        
        <CardContent className="p-0">
          <div className="relative group cursor-pointer" onClick={() => setIsZoomed(true)}>
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105"
            />
            
            {/* Vocabulary Hotspots */}
            {showVocabulary && vocabulary.map((item, index) => (
              item.position && (
                <button
                  key={index}
                  className="absolute w-4 h-4 bg-primary/80 rounded-full border-2 border-background hover:bg-primary hover:scale-110 transition-all duration-200"
                  style={{
                    left: `${item.position.x}%`,
                    top: `${item.position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onMouseEnter={() => setHoveredWord(item.word)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  <span className="sr-only">{item.word}</span>
                </button>
              )
            ))}
            
            {/* Vocabulary Tooltip */}
            {hoveredWord && (
              <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm p-2 rounded-md shadow-lg border z-10">
                <p className="font-medium text-sm">{hoveredWord}</p>
                <p className="text-xs text-muted-foreground">
                  {vocabulary.find(v => v.word === hoveredWord)?.definition}
                </p>
              </div>
            )}
            
            {/* Zoom Icon Overlay */}
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-200 flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-background opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
          
          {caption && (
            <div className="p-3 bg-muted/10">
              <p className="text-sm text-muted-foreground italic">{caption}</p>
            </div>
          )}
          
          {/* Vocabulary List */}
          {showVocabulary && vocabulary.length > 0 && (
            <div className="p-3 border-t">
              <h5 className="font-medium text-sm mb-2">Vocabulary</h5>
              <div className="space-y-2">
                {vocabulary.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="font-medium text-sm text-primary">{item.word}</span>
                    <span className="text-sm text-muted-foreground">- {item.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zoom Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{title || alt}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-auto object-contain max-h-[70vh]"
            />
            {caption && (
              <p className="text-sm text-muted-foreground mt-2 italic">{caption}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};