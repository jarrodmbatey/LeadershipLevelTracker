import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { questions } from "@shared/schema";
import { ReloadIcon } from "@radix-ui/react-icons";

interface AssessmentFormProps {
  onSubmit: (responses: Record<number, number>) => void;
  isAssessingLeader?: boolean;
  isSubmitting?: boolean;
}

export default function AssessmentForm({ 
  onSubmit, 
  isAssessingLeader = false,
  isSubmitting = false 
}: AssessmentFormProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that all questions are answered
    if (Object.keys(responses).length !== questions.length) {
      return;
    }
    onSubmit(responses);
  };

  const isComplete = Object.keys(responses).length === questions.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {questions.map((q) => (
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
        <p className="text-sm text-muted-foreground">
          {Object.keys(responses).length} of {questions.length} questions answered
        </p>
        <Button 
          type="submit" 
          disabled={!isComplete || isSubmitting}
        >
          {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Assessment"}
        </Button>
      </div>
    </form>
  );
}