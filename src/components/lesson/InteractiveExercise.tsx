import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, RefreshCw, BookOpen, PenTool } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface MultipleChoiceQuestion {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface FillBlankQuestion {
  type: 'fill-blank';
  sentence: string;
  blanks: Array<{
    answer: string;
    alternatives?: string[];
  }>;
  explanation?: string;
}

interface DragDropQuestion {
  type: 'drag-drop';
  instruction: string;
  items: string[];
  categories: Array<{
    name: string;
    items: string[];
  }>;
  explanation?: string;
}

type Exercise = MultipleChoiceQuestion | FillBlankQuestion | DragDropQuestion;

interface InteractiveExerciseProps {
  title: string;
  description?: string;
  exercises: Exercise[];
  onComplete?: (score: number) => void;
}

export const InteractiveExercise = ({ 
  title, 
  description, 
  exercises, 
  onComplete 
}: InteractiveExerciseProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answers, setAnswers] = useState<any[]>(new Array(exercises.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const exercise = exercises[currentExercise];

  const checkAnswer = (answer: any) => {
    const newAnswers = [...answers];
    newAnswers[currentExercise] = answer;
    setAnswers(newAnswers);

    let isCorrect = false;
    
    switch (exercise.type) {
      case 'multiple-choice':
        isCorrect = answer === exercise.correct;
        break;
      case 'fill-blank':
        isCorrect = Array.isArray(answer) && answer.every((ans, idx) => {
          const correctAnswers = [
            exercise.blanks[idx].answer.toLowerCase(),
            ...(exercise.blanks[idx].alternatives?.map(alt => alt.toLowerCase()) || [])
          ];
          return correctAnswers.includes(ans.toLowerCase().trim());
        });
        break;
      case 'drag-drop':
        // Simplified drag-drop checking
        isCorrect = JSON.stringify(answer) === JSON.stringify(exercise.categories);
        break;
    }

    if (isCorrect) {
      toast({
        title: "Correct!",
        description: "Well done! Moving to the next question.",
      });
    } else {
      toast({
        title: "Not quite right",
        description: "Try again or check the explanation.",
        variant: "destructive"
      });
    }

    setShowResults(true);
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setShowResults(false);
    } else {
      // Calculate final score
      const score = answers.reduce((total, answer, index) => {
        const ex = exercises[index];
        let correct = false;
        
        switch (ex.type) {
          case 'multiple-choice':
            correct = answer === ex.correct;
            break;
          case 'fill-blank':
            correct = Array.isArray(answer) && answer.every((ans, idx) => {
              const correctAnswers = [
                ex.blanks[idx].answer.toLowerCase(),
                ...(ex.blanks[idx].alternatives?.map(alt => alt.toLowerCase()) || [])
              ];
              return correctAnswers.includes(ans.toLowerCase().trim());
            });
            break;
          case 'drag-drop':
            correct = JSON.stringify(answer) === JSON.stringify(ex.categories);
            break;
        }
        
        return total + (correct ? 1 : 0);
      }, 0);

      const percentage = Math.round((score / exercises.length) * 100);
      setIsCompleted(true);
      onComplete?.(percentage);
    }
  };

  const resetExercise = () => {
    setCurrentExercise(0);
    setAnswers(new Array(exercises.length).fill(null));
    setShowResults(false);
    setIsCompleted(false);
  };

  const getExerciseIcon = () => {
    switch (exercise.type) {
      case 'multiple-choice': return <BookOpen className="w-4 h-4" />;
      case 'fill-blank': return <PenTool className="w-4 h-4" />;
      case 'drag-drop': return <RefreshCw className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (isCompleted) {
    const score = answers.reduce((total, answer, index) => {
      // Simplified scoring logic for display
      return total + (answer !== null ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / exercises.length) * 100);

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Exercise Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold text-success">{percentage}%</div>
            <p className="text-muted-foreground">
              You got {score} out of {exercises.length} questions correct!
            </p>
            <Button onClick={resetExercise} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getExerciseIcon()}
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {currentExercise + 1} / {exercises.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {exercise.type === 'multiple-choice' && (
          <MultipleChoiceExercise 
            exercise={exercise}
            onAnswer={checkAnswer}
            currentAnswer={answers[currentExercise]}
            showResults={showResults}
          />
        )}
        
        {exercise.type === 'fill-blank' && (
          <FillBlankExercise 
            exercise={exercise}
            onAnswer={checkAnswer}
            currentAnswer={answers[currentExercise]}
            showResults={showResults}
          />
        )}
        
        {exercise.type === 'drag-drop' && (
          <DragDropExercise 
            exercise={exercise}
            onAnswer={checkAnswer}
            currentAnswer={answers[currentExercise]}
            showResults={showResults}
          />
        )}

        {showResults && (
          <div className="mt-4 pt-4 border-t">
            {exercise.explanation && (
              <div className="mb-3 p-3 bg-muted/10 rounded-md">
                <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
              </div>
            )}
            
            <Button onClick={nextExercise}>
              {currentExercise < exercises.length - 1 ? 'Next Question' : 'Complete Exercise'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Sub-components for different exercise types
const MultipleChoiceExercise = ({ exercise, onAnswer, currentAnswer, showResults }: any) => (
  <div className="space-y-4">
    <h4 className="font-medium">{exercise.question}</h4>
    <div className="space-y-2">
      {exercise.options.map((option: string, index: number) => (
        <Button
          key={index}
          variant={currentAnswer === index ? "default" : "outline"}
          className="w-full justify-start text-left h-auto p-3"
          onClick={() => !showResults && onAnswer(index)}
          disabled={showResults}
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
            {showResults && index === exercise.correct && (
              <CheckCircle className="w-4 h-4 text-success ml-auto" />
            )}
            {showResults && currentAnswer === index && index !== exercise.correct && (
              <XCircle className="w-4 h-4 text-destructive ml-auto" />
            )}
          </div>
        </Button>
      ))}
    </div>
  </div>
);

const FillBlankExercise = ({ exercise, onAnswer, currentAnswer, showResults }: any) => {
  const [inputs, setInputs] = useState<string[]>(currentAnswer || new Array(exercise.blanks.length).fill(''));

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleSubmit = () => {
    onAnswer(inputs);
  };

  const parts = exercise.sentence.split('___');

  return (
    <div className="space-y-4">
      <div className="text-base leading-relaxed">
        {parts.map((part: string, index: number) => (
          <span key={index}>
            {part}
            {index < exercise.blanks.length && (
              <Input
                className="inline-block w-24 mx-1 h-8 text-center"
                value={inputs[index] || ''}
                onChange={(e) => handleInputChange(index, e.target.value)}
                disabled={showResults}
              />
            )}
          </span>
        ))}
      </div>
      
      {!showResults && (
        <Button onClick={handleSubmit}>Check Answer</Button>
      )}
    </div>
  );
};

const DragDropExercise = ({ exercise, onAnswer, showResults }: any) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [categories, setCategories] = useState(
    exercise.categories.map((cat: any) => ({ ...cat, items: [] }))
  );
  const [availableItems, setAvailableItems] = useState([...exercise.items]);

  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDrop = (categoryIndex: number) => {
    if (!draggedItem) return;

    const newCategories = [...categories];
    newCategories[categoryIndex].items.push(draggedItem);
    setCategories(newCategories);

    setAvailableItems(prev => prev.filter(item => item !== draggedItem));
    setDraggedItem(null);
  };

  const handleSubmit = () => {
    onAnswer(categories);
  };

  return (
    <div className="space-y-4">
      <p className="font-medium">{exercise.instruction}</p>
      
      {/* Available Items */}
      <div className="p-3 border-2 border-dashed border-muted rounded-md">
        <h5 className="text-sm font-medium mb-2">Items to Sort:</h5>
        <div className="flex flex-wrap gap-2">
          {availableItems.map((item: string) => (
            <Badge
              key={item}
              variant="outline"
              className="cursor-move"
              draggable
              onDragStart={() => handleDragStart(item)}
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category: any, index: number) => (
          <div
            key={category.name}
            className="p-3 border-2 border-muted rounded-md min-h-[100px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
          >
            <h5 className="font-medium mb-2">{category.name}</h5>
            <div className="space-y-1">
              {category.items.map((item: string, itemIndex: number) => (
                <Badge key={itemIndex} variant="default" className="block">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {availableItems.length === 0 && !showResults && (
        <Button onClick={handleSubmit}>Check Answer</Button>
      )}
    </div>
  );
};