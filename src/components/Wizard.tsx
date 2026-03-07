import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [direction, setDirection] = useState(1);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-5">
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              שלב {currentStep + 1} מתוך {steps.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => {
                  if (index < currentStep) {
                    setDirection(-1);
                    setCurrentStep(index);
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-colors duration-150',
                  index <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground',
                  index < currentStep && 'cursor-pointer'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-150',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                      : 'bg-muted text-muted-foreground'
                )}>
                  {index < currentStep ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-5">
        {/* Step Title & Description */}
        <div className="text-center py-1.5 border-b">
          <h3 className="text-base font-semibold">{currentStepData.title}</h3>
          {currentStepData.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{currentStepData.description}</p>
          )}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: direction * 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -15 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="min-h-[180px]"
          >
            {currentStepData.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-3 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
            className="flex-1 gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            הקודם
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentStepData.isValid === false}
            className="flex-1 gap-2"
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
