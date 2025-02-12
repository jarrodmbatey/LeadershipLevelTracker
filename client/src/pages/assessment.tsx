import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssessmentForm from "@/components/AssessmentForm";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssessmentRequest {
  id: number;
  leaderId: number;
  status: "pending" | "completed";
  createdAt: string;
  leader?: {
    name: string;
    email: string;
    project: string;
  };
}

export default function Assessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<number | null>(null);
  const [leaderAssessments, setLeaderAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "manager") {
      const fetchRequests = async () => {
        try {
          const response = await fetch('/api/assessment-requests/manager');
          if (!response.ok) throw new Error('Failed to fetch requests');
          const data = await response.json();
          setAssessmentRequests(data);
        } catch (error) {
          console.error('Error fetching requests:', error);
          toast({
            title: "Error",
            description: "Failed to load assessment requests.",
            variant: "destructive"
          });
        }
      };

      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLeaderId) {
      const fetchLeaderAssessments = async () => {
        try {
          const response = await fetch(`/api/assessments/leader/${selectedLeaderId}`);
          if (!response.ok) throw new Error('Failed to fetch leader assessments');
          const data = await response.json();
          setLeaderAssessments(data);
        } catch (error) {
          console.error('Error fetching leader assessments:', error);
          toast({
            title: "Error",
            description: "Failed to load leader's assessment history.",
            variant: "destructive"
          });
        }
      };

      fetchLeaderAssessments();
    }
  }, [selectedLeaderId]);

  const handleSubmit = async (responses: Record<number, number>) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: selectedLeaderId,
          managerId: user.id,
          responses
        })
      });

      if (!response.ok) throw new Error('Failed to submit assessment');

      toast({
        title: "Assessment Submitted",
        description: "Your responses have been recorded successfully."
      });

      // Refresh the assessment requests list
      const updatedRequestsResponse = await fetch('/api/assessment-requests/manager');
      if (updatedRequestsResponse.ok) {
        const updatedRequests = await updatedRequestsResponse.json();
        setAssessmentRequests(updatedRequests);
      }

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

      {user.role === "manager" && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {assessmentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.leader?.name}</p>
                        <Badge variant={request.status === "completed" ? "secondary" : "default"}>
                          {request.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Project: {request.leader?.project}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested on: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {request.status === "pending" && (
                      <Button
                        onClick={() => setSelectedLeaderId(request.leaderId)}
                        variant="outline"
                      >
                        Start Assessment
                      </Button>
                    )}
                    {request.status === "completed" && (
                      <Button
                        onClick={() => setSelectedLeaderId(request.leaderId)}
                        variant="secondary"
                      >
                        View Assessment
                      </Button>
                    )}
                  </div>
                ))}
                {assessmentRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No assessment requests found.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {(user.role === "leader" || selectedLeaderId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {user.role === "leader" ? "Complete Your Assessment" : "Leader Assessment"}
            </CardTitle>
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
                  isAssessingLeader={selectedLeaderId !== null}
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