import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { questions } from "@shared/schema";

interface AssessmentFormProps {
  onSubmit: (responses: Record<number, number>) => void;
  role: "admin" | "leader" | "manager";
  isAssessingLeader?: boolean;
}

export default function AssessmentForm({ onSubmit, role, isAssessingLeader = false }: AssessmentFormProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(responses);
  };

  if (role === "admin") {
    return <p>Administrators cannot complete assessments</p>;
  }

  if (role === "manager" && !isAssessingLeader) {
    return <p>Managers can only assess leaders. Please wait for assessment requests from leaders.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {questions.map((q) => (
        <div key={q.id} className="space-y-4">
          <p className="text-lg font-medium">{q.text}</p>
          <RadioGroup
            onValueChange={(value) => 
              setResponses(prev => ({...prev, [q.id]: parseInt(value)}))
            }
            value={responses[q.id]?.toString()}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value.toString()} id={`q${q.id}-${value}`} />
                <Label htmlFor={`q${q.id}-${value}`}>
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
      <Button type="submit">Submit Assessment</Button>
    </form>
  );
}