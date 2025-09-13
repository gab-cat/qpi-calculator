import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, BookTemplate, PlusCircle, ArrowRight, FileText, Sparkles, Calculator } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface HomePageProps {
  onOptionSelect: (option: 'csv' | 'template' | 'blank') => void;
}

interface WelcomeOption {
  id: 'csv' | 'template' | 'blank';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  complexity: 'simple' | 'moderate' | 'advanced';
  timeEstimate: string;
  recommended?: boolean;
}

const welcomeOptions: WelcomeOption[] = [
  {
    id: 'csv',
    title: 'Import CSV Data',
    description: 'Upload your existing grade records from a spreadsheet or student portal export.',
    icon: Upload,
    benefits: [
      'Quick setup with existing data',
      'Bulk import multiple semesters',
      'Automatic grade calculations',
      'Data validation and preview'
    ],
    complexity: 'simple',
    timeEstimate: '2-5 minutes',
    recommended: true,
  },
  {
    id: 'template',
    title: 'Use Course Template',
    description: 'Start with a pre-designed academic program template and fill in your grades.',
    icon: BookTemplate,
    benefits: [
      'Structured academic planning',
      'Standard course sequences',
      'Built-in requirements',
      'Guided semester organization'
    ],
    complexity: 'moderate',
    timeEstimate: '5-10 minutes',
  },
  {
    id: 'blank',
    title: 'Start Fresh',
    description: 'Create your academic record from scratch with complete customization.',
    icon: PlusCircle,
    benefits: [
      'Full customization control',
      'Flexible semester structure',
      'Custom course creation',
      'Personalized organization'
    ],
    complexity: 'advanced',
    timeEstimate: '10-15 minutes',
  },
];

export function HomePage({ onOptionSelect }: HomePageProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [parent] = useAutoAnimate();
  const [benefitsParent] = useAutoAnimate();

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleContinue = () => {
    if (selectedOption) {
      onOptionSelect(selectedOption as 'csv' | 'template' | 'blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">QPI Calculator</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your academic performance and calculate your Quality Point Index with ease.
            Choose how you'd like to get started:
          </p>
        </div>

        {/* Options Grid */}
        <div ref={parent} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {welcomeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;
            
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5 shadow-lg -translate-y-1' 
                    : 'hover:bg-accent/50'
                } ${option.recommended ? 'relative' : ''}`}
                onClick={() => setSelectedOption(option.id)}
              >
                {option.recommended && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Complexity & Time */}
                  <div className="flex items-center justify-between text-sm">
                    <Badge 
                      variant="outline" 
                      className={getComplexityColor(option.complexity)}
                    >
                      {option.complexity}
                    </Badge>
                    <span className="text-muted-foreground">{option.timeEstimate}</span>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">What you'll get:</h4>
                    <ul ref={benefitsParent} className="space-y-1">
                      {option.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex items-center justify-center pt-2">
                      <Badge variant="default" className="bg-primary">
                        Selected
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-4">
          <Button 
            onClick={handleContinue}
            disabled={!selectedOption}
            size="lg"
            className="min-w-48"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't worry! You can change your approach or import data later.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>CSV, Excel support</span>
              </div>
              <div className="flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                <span>Auto QPI calculation</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Grade tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">Need help choosing?</h3>
            <p className="text-sm text-muted-foreground">
              If you have existing grade data in Excel or CSV format, choose <strong>Import CSV Data</strong>.
              For a structured approach with standard courses, try <strong>Course Template</strong>.
              Want complete control? Go with <strong>Start Fresh</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}