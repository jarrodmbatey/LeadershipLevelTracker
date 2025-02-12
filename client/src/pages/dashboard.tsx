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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import ScoreChart from "@/components/ScoreChart";
import GapAnalysis from "@/components/GapAnalysis";
import { useToast } from "@/hooks/use-toast";
import { questions } from "@shared/schema";
import { useLocation } from "wouter";
import LeadershipCategoriesChart from "@/components/LeadershipCategoriesChart";

interface Assessment {
  id: number;
  questionId: number;
  leaderScore: number | null;
  managerScore: number | null;
}

interface Gap {
  category: "position" | "permission" | "production" | "people" | "pinnacle";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [showCompletedNotification, setShowCompletedNotification] = useState(false);
  const [assessmentData, setAssessmentData] = useState<{
    leaderScores: number[];
    managerScores: number[];
    gaps: Gap[];
  }>({
    leaderScores: [0, 0, 0, 0, 0],
    managerScores: [0, 0, 0, 0, 0],
    gaps: []
  });
  const [assessments, setAssessments] = useState<Assessment[]>([]); // Added state for assessments

  // Check for completed assessments on login
  useEffect(() => {
    const checkCompletedAssessments = async () => {
      if (!user || user.role !== 'leader') return;

      try {
        const response = await fetch(`/api/assessments/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const assessments: Assessment[] = await response.json();
        setAssessments(assessments); // Update assessments state

        // Check if there are any manager scores (completed assessments)
        const hasManagerScores = assessments.some(a => a.managerScore !== null);
        setShowCompletedNotification(hasManagerScores);
      } catch (error) {
        console.error('Error checking completed assessments:', error);
      }
    };

    checkCompletedAssessments();
  }, [user]);

  // Fetch assessment requests when dialog opens
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !showRequests) return;

      try {
        // If user is a manager, fetch requests to assess others
        if (user.role === 'manager') {
          const response = await fetch(`/api/assessment-requests/manager?managerId=${user.id}`, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) throw new Error('Failed to fetch requests');
          const data = await response.json();
          setAssessmentRequests(data);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment requests.",
          variant: "destructive"
        });
      }
    };

    // If user is a leader and searching for managers, fetch managers
    const searchManagers = async () => {
      if (!user || !showRequests || user.role !== 'leader' || !searchTerm) return;

      try {
        const response = await fetch(`/api/users?role=manager&search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Failed to search managers');
        const data = await response.json();
        setManagers(data);
      } catch (error) {
        console.error('Error searching managers:', error);
        toast({
          title: "Error",
          description: "Failed to search managers.",
          variant: "destructive"
        });
      }
    };

    fetchRequests();
    searchManagers();
  }, [user, showRequests, searchTerm]);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/assessments/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const assessments: Assessment[] = await response.json();
        setAssessments(assessments); // Update assessments state

        // Calculate scores and gaps
        const categoryScores = {
          position: { leader: [] as number[], manager: [] as number[] },
          permission: { leader: [] as number[], manager: [] as number[] },
          production: { leader: [] as number[], manager: [] as number[] },
          people: { leader: [] as number[], manager: [] as number[] },
          pinnacle: { leader: [] as number[], manager: [] as number[] }
        };

        // Process each assessment
        assessments.forEach(assessment => {
          const question = questions.find(q => q.id === assessment.questionId);
          if (!question) return;

          // Add scores to appropriate category if they exist
          if (assessment.leaderScore) {
            categoryScores[question.category].leader.push(assessment.leaderScore);
          }
          if (assessment.managerScore) {
            categoryScores[question.category].manager.push(assessment.managerScore);
          }
        });

        // Calculate average scores for each category
        const categories = Object.keys(categoryScores) as Array<keyof typeof categoryScores>;
        const leaderScores = categories.map(category => {
          const scores = categoryScores[category].leader;
          return scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
        });

        const managerScores = categories.map(category => {
          const scores = categoryScores[category].manager;
          return scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
        });

        // Find significant gaps (difference >= 2)
        const significantGaps = assessments
          .filter(a => a.leaderScore !== null && a.managerScore !== null)
          .map(a => {
            const question = questions.find(q => q.id === a.questionId);
            if (!question || !a.leaderScore || !a.managerScore) return null;

            const gap = Math.abs(a.leaderScore - a.managerScore);
            if (gap < 2) return null;

            return {
              category: question.category,
              question: question.text,
              leaderScore: a.leaderScore,
              managerScore: a.managerScore,
              gap
            };
          })
          .filter((gap): gap is Gap => gap !== null);

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
      setShowRequests(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const categories = questions.reduce((acc, question) => {
    acc[question.category] = acc[question.category] || [];
    acc[question.category].push(question.id);
    return acc;
  }, {} as { [key: string]: number[] });


  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/self-assessment")} variant="default">
            Take Self-Assessment
          </Button>
          <Button onClick={() => setShowRequests(true)} variant="outline">
            {user.role === 'manager' ? 'View Assessment Requests' : 'Request Assessment'}
          </Button>
        </div>
      </div>

      {showCompletedNotification && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Assessment Completed</AlertTitle>
          <AlertDescription>
            Your manager has completed their assessment. View your updated scores below.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {user.role === 'manager' ? 'Assessment Requests' : 'Request Manager Assessment'}
            </DialogTitle>
          </DialogHeader>

          {user.role === 'manager' ? (
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
          ) : (
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
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Level Scores</CardTitle>
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

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="h-5 w-5 text-green-500" />
                <CardTitle>Top 3 Strengths</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(categories)
                .map(([category, questionIds]) => {
                  const categoryAssessments = assessments.filter(a =>
                    questionIds.includes(a.questionId)
                  );

                  const scores = categoryAssessments.reduce((acc, assessment) => {
                    if (assessment.leaderScore) acc.push(assessment.leaderScore);
                    if (assessment.managerScore) acc.push(assessment.managerScore);
                    return acc;
                  }, [] as number[]);

                  const avgScore = scores.length > 0
                    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                    : 0;

                  return { category, avgScore };
                })
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 3)
                .map((strength, index) => (
                  <div key={strength.category} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{index + 1}. {strength.category}</p>
                      <span className="text-green-500 font-semibold">
                        {strength.avgScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowDownIcon className="h-5 w-5 text-orange-500" />
                <CardTitle>Top 3 Opportunities</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(categories)
                .map(([category, questionIds]) => {
                  const categoryAssessments = assessments.filter(a =>
                    questionIds.includes(a.questionId)
                  );

                  const scores = categoryAssessments.reduce((acc, assessment) => {
                    if (assessment.leaderScore) acc.push(assessment.leaderScore);
                    if (assessment.managerScore) acc.push(assessment.managerScore);
                    return acc;
                  }, [] as number[]);

                  const avgScore = scores.length > 0
                    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                    : 0;

                  return { category, avgScore };
                })
                .sort((a, b) => a.avgScore - b.avgScore)
                .slice(0, 3)
                .map((opportunity, index) => (
                  <div key={opportunity.category} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{index + 1}. {opportunity.category}</p>
                      <span className="text-orange-500 font-semibold">
                        {opportunity.avgScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Key Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Self Assessment Score</p>
              <p className="text-2xl font-bold">
                {(assessmentData.leaderScores.reduce((a, b) => a + b, 0) / 5).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Manager Assessment Score</p>
              <p className="text-2xl font-bold">
                {(assessmentData.managerScores.reduce((a, b) => a + b, 0) / 5).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Final Leadership Score</p>
              <p className="text-2xl font-bold">
                {((assessmentData.leaderScores.reduce((a, b) => a + b, 0) / 5 +
                  assessmentData.managerScores.reduce((a, b) => a + b, 0) / 5) / 2).toFixed(2)}
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
          <CardTitle>Leadership Categories Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadershipCategoriesChart assessments={assessments} />
        </CardContent>
      </Card>

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