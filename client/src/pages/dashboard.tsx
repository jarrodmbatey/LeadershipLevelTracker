import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ScoreChart from "@/components/ScoreChart";
import GapAnalysis from "@/components/GapAnalysis";
import { useToast } from "@/hooks/use-toast";
import { questions } from "@shared/schema";
import { useLocation } from "wouter";

interface Assessment {
  id: number;
  questionId: number;
  leaderScore: number | null;
  managerScore: number | null;
}

interface Gap {
  category: string;
  question: string;
  leaderScore: number;
  managerScore: number;
  gap: number;
}

interface Manager {
  id: number;
  name: string;
  email: string;
}

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

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showRequests, setShowRequests] = useState(false);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [assessmentData, setAssessmentData] = useState<{
    leaderScores: number[];
    managerScores: number[];
    gaps: Gap[];
  }>({
    leaderScores: [0, 0, 0],
    managerScores: [0, 0, 0],
    gaps: []
  });

  // Fetch assessment requests where user is the manager
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/assessment-requests/manager', {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies for authentication
        });

        if (response.status === 403) {
          console.log('User is not authorized to view requests');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch requests');

        const data = await response.json();
        console.log('Fetched requests:', data);
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

    if (showRequests) {
      fetchRequests();
    }
  }, [user, showRequests]);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/assessments/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const assessments: Assessment[] = await response.json();

        // Calculate scores and gaps
        const categoryScores = {
          positional: { leader: [] as number[], manager: [] as number[] },
          permission: { leader: [] as number[], manager: [] as number[] },
          production: { leader: [] as number[], manager: [] as number[] }
        };

        assessments.forEach(assessment => {
          const question = questions.find(q => q.id === assessment.questionId);
          if (question && assessment.leaderScore && assessment.managerScore) {
            categoryScores[question.category].leader.push(assessment.leaderScore);
            categoryScores[question.category].manager.push(assessment.managerScore);
          }
        });

        // Calculate average scores for each category
        const leaderScores = Object.values(categoryScores).map(
          category => category.leader.length > 0
            ? category.leader.reduce((a, b) => a + b, 0) / category.leader.length
            : 0
        );
        const managerScores = Object.values(categoryScores).map(
          category => category.manager.length > 0
            ? category.manager.reduce((a, b) => a + b, 0) / category.manager.length
            : 0
        );

        // Find significant gaps
        const significantGaps = assessments
          .filter(a => a.leaderScore && a.managerScore && Math.abs(a.leaderScore - a.managerScore) >= 2)
          .map(a => {
            const question = questions.find(q => q.id === a.questionId);
            return {
              category: question?.category || "",
              question: question?.text || "",
              leaderScore: a.leaderScore!,
              managerScore: a.managerScore!,
              gap: Math.abs(a.leaderScore! - a.managerScore!)
            };
          });

        setAssessmentData({
          leaderScores,
          managerScores,
          gaps: significantGaps
        });
      } catch (error) {
        console.error('Error fetching assessments:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment data.",
          variant: "destructive"
        });
      }
    };

    fetchAssessments();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/self-assessment")} variant="default">
            Take Self-Assessment
          </Button>
          {user.role === 'manager' && (
            <Button onClick={() => setShowRequests(true)} variant="outline">
              View Assessment Requests
            </Button>
          )}
        </div>
      </div>

      {/* Assessment Requests Dialog */}
      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assessment Requests</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
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
                      onClick={() => setLocation(`/assessment/${request.leaderId}`)}
                      variant="outline"
                    >
                      Start Assessment
                    </Button>
                  )}
                  {request.status === "completed" && (
                    <Button
                      onClick={() => setLocation(`/assessment/${request.leaderId}`)}
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
        </DialogContent>
      </Dialog>

      {/* Assessment Results Section */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ScoreChart
                leaderScores={assessmentData.leaderScores}
                managerScores={assessmentData.managerScores}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Final Leadership Score</p>
              <p className="text-2xl font-bold">
                {((assessmentData.leaderScores.reduce((a, b) => a + b, 0) / 3 +
                  assessmentData.managerScores.reduce((a, b) => a + b, 0) / 3) / 2).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Number of Significant Gaps</p>
              <p className="text-2xl font-bold">{assessmentData.gaps.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {assessmentData.gaps.length > 0 ? (
            <GapAnalysis gaps={assessmentData.gaps} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No significant gaps found in the assessment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}