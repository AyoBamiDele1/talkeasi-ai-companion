import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, BookOpen, Lightbulb } from 'lucide-react';

interface WordScore {
  word: string;
  score: number;
  feedback: string;
  phoneticTranscription?: string;
}

interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

interface VocabularyEnhancement {
  word: string;
  betterAlternatives: string[];
  context: string;
}

interface FluencyFeedback {
  pace: string;
  clarity: string;
  suggestions: string[];
}

interface PronunciationAnalysisData {
  overallScore: number;
  wordScores: WordScore[];
  grammarCorrections: GrammarCorrection[];
  vocabularyEnhancements: VocabularyEnhancement[];
  fluencyFeedback: FluencyFeedback;
}

interface PronunciationAnalysisProps {
  analysis: PronunciationAnalysisData;
  isVisible: boolean;
}

const PronunciationAnalysis: React.FC<PronunciationAnalysisProps> = ({
  analysis,
  isVisible
}) => {
  if (!isVisible || !analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={analysis.overallScore} className="h-3" />
            </div>
            <Badge variant={getScoreBadgeVariant(analysis.overallScore)} className="text-sm">
              {analysis.overallScore}/100
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Word-by-word Analysis */}
      {analysis.wordScores && analysis.wordScores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Pronunciation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.wordScores.map((wordScore, index) => (
              <div key={index} className="border rounded-lg p-3 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{wordScore.word}</span>
                  <Badge variant={getScoreBadgeVariant(wordScore.score)}>
                    {wordScore.score}/100
                  </Badge>
                </div>
                {wordScore.phoneticTranscription && (
                  <div className="text-sm text-muted-foreground mb-1">
                    IPA: /{wordScore.phoneticTranscription}/
                  </div>
                )}
                <p className="text-sm">{wordScore.feedback}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grammar Corrections */}
      {analysis.grammarCorrections && analysis.grammarCorrections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Grammar Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.grammarCorrections.map((correction, index) => (
              <div key={index} className="border rounded-lg p-3 bg-background/50">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Original: </span>
                    <span className="line-through text-red-600">{correction.original}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Suggested: </span>
                    <span className="text-green-600 font-medium">{correction.corrected}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{correction.explanation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vocabulary Enhancements */}
      {analysis.vocabularyEnhancements && analysis.vocabularyEnhancements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Vocabulary Enhancements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.vocabularyEnhancements.map((enhancement, index) => (
              <div key={index} className="border rounded-lg p-3 bg-background/50">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Instead of: </span>
                    <span className="font-medium">{enhancement.word}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Try: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {enhancement.betterAlternatives.map((alt, altIndex) => (
                        <Badge key={altIndex} variant="outline" className="text-xs">
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{enhancement.context}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fluency Feedback */}
      {analysis.fluencyFeedback && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5" />
              Fluency & Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 bg-background/50">
                <h4 className="font-medium text-sm mb-1">Pace</h4>
                <p className="text-sm text-muted-foreground">{analysis.fluencyFeedback.pace}</p>
              </div>
              <div className="border rounded-lg p-3 bg-background/50">
                <h4 className="font-medium text-sm mb-1">Clarity</h4>
                <p className="text-sm text-muted-foreground">{analysis.fluencyFeedback.clarity}</p>
              </div>
            </div>
            {analysis.fluencyFeedback.suggestions && analysis.fluencyFeedback.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Improvement Suggestions:</h4>
                <ul className="space-y-1">
                  {analysis.fluencyFeedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PronunciationAnalysis;