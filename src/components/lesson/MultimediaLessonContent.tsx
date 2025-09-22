import { AudioPlayer } from './AudioPlayer';
import { ImageDisplay } from './ImageDisplay';
import { InteractiveExercise } from './InteractiveExercise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Volume2, Image, Gamepad2 } from 'lucide-react';

interface LessonContent {
  scenarios?: string[];
  key_phrases?: string[];
  audio_content?: Array<{
    src: string;
    title: string;
    description?: string;
    type: 'pronunciation' | 'dialogue' | 'example';
    transcription?: string;
  }>;
  images?: Array<{
    src: string;
    alt: string;
    title?: string;
    description?: string;
    caption?: string;
    type: 'vocabulary' | 'scenario' | 'illustration' | 'cultural';
    vocabulary?: Array<{
      word: string;
      definition: string;
      position?: { x: number; y: number };
    }>;
  }>;
  exercises?: Array<{
    type: 'multiple-choice';
    question: string;
    options: string[];
    correct: number;
    explanation?: string;
  } | {
    type: 'fill-blank';
    sentence: string;
    blanks: Array<{
      answer: string;
      alternatives?: string[];
    }>;
    explanation?: string;
  } | {
    type: 'drag-drop';
    instruction: string;
    items: string[];
    categories: Array<{
      name: string;
      items: string[];
    }>;
    explanation?: string;
  }>;
}

interface MultimediaLessonContentProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    difficulty: string;
    category: string;
    content: LessonContent;
  };
  onExerciseComplete?: (score: number) => void;
}

export const MultimediaLessonContent = ({ 
  lesson, 
  onExerciseComplete 
}: MultimediaLessonContentProps) => {
  const { content } = lesson;
  
  const hasAudio = content.audio_content && content.audio_content.length > 0;
  const hasImages = content.images && content.images.length > 0;
  const hasExercises = content.exercises && content.exercises.length > 0;
  const hasKeyPhrases = content.key_phrases && content.key_phrases.length > 0;
  const hasScenarios = content.scenarios && content.scenarios.length > 0;

  // Count total interactive elements
  const interactiveCount = [hasAudio, hasImages, hasExercises].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{lesson.title}</CardTitle>
              {lesson.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {lesson.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{lesson.difficulty}</Badge>
              <Badge variant="outline">{lesson.category}</Badge>
            </div>
          </div>
          
          {interactiveCount > 0 && (
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {hasAudio && (
                <div className="flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  <span>{content.audio_content?.length} Audio</span>
                </div>
              )}
              {hasImages && (
                <div className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  <span>{content.images?.length} Images</span>
                </div>
              )}
              {hasExercises && (
                <div className="flex items-center gap-1">
                  <Gamepad2 className="w-4 h-4" />
                  <span>{content.exercises?.length} Exercises</span>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Overview
          </TabsTrigger>
          {hasAudio && (
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Audio
            </TabsTrigger>
          )}
          {hasImages && (
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
          )}
          {hasExercises && (
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Practice
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {hasScenarios && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Practice Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {content.scenarios?.map((scenario, index) => (
                    <div 
                      key={index}
                      className="p-3 border rounded-md bg-muted/5 hover:bg-muted/10 transition-colors"
                    >
                      <p className="text-sm">{scenario}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasKeyPhrases && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Phrases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {content.key_phrases?.map((phrase, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2 border-l-2 border-primary/50 bg-primary/5"
                    >
                      <span className="text-xs text-primary font-medium">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <p className="text-sm font-medium">{phrase}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audio Tab */}
        {hasAudio && (
          <TabsContent value="audio" className="space-y-4">
            {content.audio_content?.map((audio, index) => (
              <AudioPlayer
                key={index}
                src={audio.src}
                title={audio.title}
                description={audio.description}
                type={audio.type}
                transcription={audio.transcription}
              />
            ))}
          </TabsContent>
        )}

        {/* Images Tab */}
        {hasImages && (
          <TabsContent value="images" className="space-y-4">
            {content.images?.map((image, index) => (
              <ImageDisplay
                key={index}
                src={image.src}
                alt={image.alt}
                title={image.title}
                description={image.description}
                caption={image.caption}
                type={image.type}
                vocabulary={image.vocabulary}
              />
            ))}
          </TabsContent>
        )}

        {/* Exercises Tab */}
        {hasExercises && (
          <TabsContent value="exercises" className="space-y-4">
            <InteractiveExercise
              title={`${lesson.title} - Practice Exercises`}
              description="Complete these exercises to test your understanding"
              exercises={(content.exercises || []) as any}
              onComplete={onExerciseComplete}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};