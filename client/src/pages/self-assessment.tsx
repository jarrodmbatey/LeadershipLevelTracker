import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AssessmentForm from "@/components/AssessmentForm";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function SelfAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAssessment, setShowAssessment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (responses: Record<number, number>) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Create an array of assessment submissions, one for each question
      const assessmentPromises = Object.entries(responses).map(([questionId, score]) => {
        return fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leaderId: user.id,
            questionId: parseInt(questionId),
            leaderScore: score
          })
        });
      });

      // Wait for all assessment submissions to complete
      await Promise.all(assessmentPromises);

      toast({
        title: "Assessment Submitted",
        description: "Your self-assessment has been recorded successfully."
      });

      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leadership Self-Assessment</h1>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {showAssessment ? "Assessment Questions" : "Instructions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showAssessment ? (
            <div className="space-y-6">
              <div className="prose max-w-none">
                <h3>Assessment Instructions</h3>
                <ul>
                  <li>Rate each statement on a scale of 1-5</li>
                  <li>1 = Strongly Disagree, 5 = Strongly Agree</li>
                  <li>Be honest and objective in your responses</li>
                  <li>Consider specific examples when rating each statement</li>
                  <li>Complete all questions in one session</li>
                </ul>

                <h3>Categories</h3>
                <ul>
                  <li><strong>Positional Leadership:</strong> Authority and responsibility in your role</li>
                  <li><strong>Permission Leadership:</strong> Trust and relationships with team members</li>
                  <li><strong>Production Leadership:</strong> Results and accountability</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowAssessment(true)}>
                  Start Assessment
                </Button>
              </div>
            </div>
          ) : (
            <AssessmentForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}