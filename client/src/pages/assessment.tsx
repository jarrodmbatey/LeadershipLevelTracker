import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssessmentForm from "@/components/AssessmentForm";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Assessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (responses: Record<number, number>) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Create assessment entries for each question
      const batch = [];
      for (const [questionId, score] of Object.entries(responses)) {
        const assessmentRef = doc(collection(db, "assessments"));
        const assessmentData = {
          leaderId: user.role === "leader" ? user.id : "",
          managerId: user.role === "manager" ? user.id : "",
          questionId: parseInt(questionId),
          leaderScore: user.role === "leader" ? score : null,
          managerScore: user.role === "manager" ? score : null,
          completedAt: new Date().toISOString()
        };

        batch.push(setDoc(assessmentRef, assessmentData));
      }

      await Promise.all(batch);

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
      <h1 className="text-3xl font-bold">Leadership Assessment</h1>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Assessment</CardTitle>
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
                role={user.role}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}