import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [viewAsLeader, setViewAsLeader] = useState(true);
  const [showManagerSearch, setShowManagerSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [managers, setManagers] = useState<Manager[]>([]);
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

  // Fetch assessment requests for managers
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

  // Search for managers
  useEffect(() => {
    if (showManagerSearch && searchTerm) {
      const searchManagers = async () => {
        try {
          const response = await fetch(`/api/users?role=manager&search=${encodeURIComponent(searchTerm)}`);
          if (!response.ok) throw new Error('Failed to search managers');
          const data = await response.json();
          setManagers(data);
        } catch (error) {
          console.error('Error searching managers:', error);
          toast({
            title: "Error",
            description: "Failed to search managers. Please try again.",
            variant: "destructive"
          });
        }
      };

      searchManagers();
    }
  }, [searchTerm, showManagerSearch]);

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

  const requestManagerAssessment = async (managerId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/assessment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderId: user.id, managerId })
      });

      if (!response.ok) throw new Error('Failed to send request');

      toast({
        title: "Request Sent",
        description: "Your manager has been notified to complete the assessment."
      });
      setShowManagerSearch(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex items-center space-x-4">
          {user.role === "manager" && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={!viewAsLeader}
                onCheckedChange={(checked) => setViewAsLeader(!checked)}
              />
              <Label>View as Manager</Label>
            </div>
          )}
          {user.role === "leader" && (
            <Button onClick={() => setShowManagerSearch(true)} variant="outline">
              Request Manager Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Manager Assessment Requests Section */}
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
          </CardContent>
        </Card>
      )}

      {/* Manager Search Dialog */}
      <Dialog open={showManagerSearch} onOpenChange={setShowManagerSearch}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search for Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search by manager name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => requestManagerAssessment(manager.id)}
                  >
                    <div>
                      <p className="font-medium">{manager.name}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                    <Button variant="ghost" size="sm">Select</Button>
                  </div>
                ))}
                {searchTerm && managers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No managers found matching "{searchTerm}"
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Data Section */}
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