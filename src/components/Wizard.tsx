import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface WizardStep {
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  title: string;
  icon?: ReactNode;
}

export function Wizard({ steps, onComplete, title, icon }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepData = steps[currentStep];
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              שלב {currentStep + 1} מתוך {steps.length}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  index <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  index < currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : index === currentStep 
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step Title & Description */}
        <div className="text-center py-2 border-b">
          <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
          {currentStepData.description && (
            <p className="text-sm text-muted-foreground mt-1">{currentStepData.description}</p>
          )}
        </div>
        
        {/* Step Content */}
        <div className="min-h-[200px] animate-fade-in">
          {currentStepData.content}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            הקודם
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={currentStepData.isValid === false}
            className="gap-2"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                חשב תוצאות
              </>
            ) : (
              <>
                הבא
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
