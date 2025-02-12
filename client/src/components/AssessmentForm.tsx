import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { questions } from "@shared/schema";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface AssessmentFormProps {
  onSubmit: (responses: Record<number, number>) => void;
  isAssessingLeader?: boolean;
  isSubmitting?: boolean;
}

const sections = [
  { name: "Position", start: 1, end: 10 },
  { name: "Permission", start: 11, end: 20 },
  { name: "Production", start: 21, end: 30 },
  { name: "People Development", start: 31, end: 40 },
  { name: "Pinnacle", start: 41, end: 50 }
];

export default function AssessmentForm({ 
  onSubmit, 
  isAssessingLeader = false,
  isSubmitting = false 
}: AssessmentFormProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [currentSection, setCurrentSection] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that all questions are answered
    if (Object.keys(responses).length !== questions.length) {
      return;
    }
    onSubmit(responses);
  };

  const currentQuestions = questions.filter(
    q => q.id >= sections[currentSection].start && q.id <= sections[currentSection].end
  );

  const isCurrentSectionComplete = currentQuestions.every(
    q => responses[q.id] !== undefined
  );

  const isFinalSection = currentSection === sections.length - 1;
  const isComplete = Object.keys(responses).length === questions.length;

  const navigateToSection = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else if (direction === 'prev' && currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          Section {currentSection + 1}: {sections[currentSection].name}
        </h2>
        <div className="text-sm text-muted-foreground">
          {sections[currentSection].start}-{sections[currentSection].end} of {questions.length} questions
        </div>
      </div>

      {currentQuestions.map((q) => (
        <div key={q.id} className="space-y-4 p-4 rounded-lg border">
          <div className="flex justify-between items-start gap-4">
            <p className="text-lg font-medium">{q.text}</p>
            <span className="text-sm text-muted-foreground capitalize px-2 py-1 bg-secondary rounded">
              {q.category}
            </span>
          </div>
          <RadioGroup
            onValueChange={(value) => 
              setResponses(prev => ({...prev, [q.id]: parseInt(value)}))
            }
            value={responses[q.id]?.toString()}
            className="space-y-2"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value.toString()} id={`q${q.id}-${value}`} />
                <Label htmlFor={`q${q.id}-${value}`} className="flex-1 cursor-pointer">
                  {value} - {value === 1 ? "Strongly Disagree" : 
                           value === 2 ? "Disagree" :
                           value === 3 ? "Neutral" :
                           value === 4 ? "Agree" : "Strongly Agree"}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {currentSection > 0 && (
            <Button 
              type="button"
              variant="outline"
              onClick={() => navigateToSection('prev')}
            >
              <ChevronLeftIcon className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {!isFinalSection && (
            <Button 
              type="button"
              onClick={() => navigateToSection('next')}
              disabled={!isCurrentSectionComplete}
            >
              Next
              <ChevronRightIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        {isFinalSection && (
          <Button 
            type="submit" 
            disabled={!isComplete || isSubmitting}
          >
            {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          {sections.map((section, index) => (
            <div
              key={section.name}
              className={`w-3 h-3 rounded-full ${
                index === currentSection
                  ? "bg-primary"
                  : index < currentSection
                  ? "bg-primary/50"
                  : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {Object.keys(responses).length} of {questions.length} questions answered
        </p>
      </div>
    </form>
  );
}