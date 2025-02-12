import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssessmentForm from "@/components/AssessmentForm";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AssessmentPageProps {
  params: {
    leaderId: string;
  };
}

export default function Assessment({ params }: AssessmentPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderDetails, setLeaderDetails] = useState<{
    name: string;
    project: string;
  } | null>(null);

  const leaderId = parseInt(params.leaderId);

  useEffect(() => {
    const fetchLeaderDetails = async () => {
      try {
        const response = await fetch(`/api/users/${leaderId}`);
        if (!response.ok) throw new Error('Failed to fetch leader details');
        const data = await response.json();
        setLeaderDetails(data);
      } catch (error) {
        console.error('Error fetching leader details:', error);
        toast({
          title: "Error",
          description: "Failed to load leader details.",
          variant: "destructive"
        });
      }
    };

    if (leaderId) {
      fetchLeaderDetails();
    }
  }, [leaderId]);

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
            leaderId,
            managerId: user.id,
            questionId: parseInt(questionId),
            managerScore: score
          })
        });
      });

      // Wait for all assessment submissions to complete
      await Promise.all(assessmentPromises);

      // Update the assessment request status to completed
      const response = await fetch('/api/assessment-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) throw new Error('Failed to update assessment status');

      toast({
        title: "Assessment Submitted",
        description: "Your responses have been recorded successfully."
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
        <h1 className="text-3xl font-bold">Leadership Assessment</h1>
      </div>

      {leaderDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Assessing {leaderDetails.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="instructions">
              <TabsList>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="assessment">Assessment Form</TabsTrigger>
              </TabsList>

              <TabsContent value="instructions" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="assessment">
                <AssessmentForm
                  onSubmit={handleSubmit}
                  isAssessingLeader={true}
                  isSubmitting={isSubmitting}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}