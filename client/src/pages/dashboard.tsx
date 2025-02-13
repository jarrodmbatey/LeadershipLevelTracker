import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { CheckCircle2, ArrowUpIcon, ArrowDownIcon, ArrowRightLeft, Bell } from "lucide-react";
import ScoreChart from "@/components/ScoreChart";
import { useToast } from "@/hooks/use-toast";
import { questions } from "@shared/schema";
import { useLocation } from "wouter";
import LeadershipCategoriesChart from "@/components/LeadershipCategoriesChart";
import LeadershipLevelBar from "@/components/LeadershipLevelBar";
import LeadershipCalculationDialog from "@/components/LeadershipCalculationDialog";
import CategoryDetailsDialog from "@/components/CategoryDetailsDialog";

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

interface CategoryScores {
  [key: string]: {
    leader: number[];
    manager: number[];
  };
}

const categories = {
  "Character & Integrity": [1, 9, 49, 39, 6],
  "Communication & Influence": [7, 4, 15, 11, 42],
  "Vision & Strategic Thinking": [44, 45, 40, 41, 50],
  "Accountability & Decision-Making": [3, 8, 29, 24, 5],
  "Emotional Intelligence & Relationships": [12, 18, 13, 19, 17],
  "Coaching & Development": [31, 32, 33, 37, 36],
  "Motivation & Team Culture": [16, 14, 20, 46, 35],
  "Execution & Results": [21, 23, 22, 25, 30],
  "Innovation & Adaptability": [26, 27, 34, 38, 43],
  "Reputation & Influence": [47, 48, 43, 42, 41]
};

const leadershipLevels = [
  { level: "Position (Rights)", range: [1, 39], description: "Authority and formal leadership role" },
  { level: "Permission (Relationships)", range: [40, 59], description: "Building trust and influence" },
  { level: "Production (Results)", range: [60, 79], description: "Driving outcomes and achievements" },
  { level: "People Development (Reproduction)", range: [80, 94], description: "Developing and empowering others" },
  { level: "Pinnacle (Legacy & Influence)", range: [95, 100], description: "Creating lasting impact" }
];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showRequests, setShowRequests] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [showCompletedNotification, setShowCompletedNotification] = useState(false);
  const [showRequestNotification, setShowRequestNotification] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentData, setAssessmentData] = useState({
    leaderScores: [0, 0, 0, 0, 0],
    managerScores: [0, 0, 0, 0, 0],
    gaps: [] as Gap[],
    currentLevel: {
      level: "",
      description: ""
    },
    scorePercentage: 0,
    overallScore: 0,
    selfAssessmentScore: 0,
    managerAssessmentScore: 0
  });
  const [showCalculation, setShowCalculation] = useState(false);
  const [showStrengths, setShowStrengths] = useState(false);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [showGaps, setShowGaps] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState<{
    strengths: any[];
    opportunities: any[];
    gaps: any[];
  }>({
    strengths: [],
    opportunities: [],
    gaps: []
  });

  useEffect(() => {
    const checkCompletedAssessments = async () => {
      if (!user || user.role !== 'leader') return;

      try {
        const response = await fetch(`/api/assessments/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const fetchedAssessments: Assessment[] = await response.json();

        const hasManagerScores = fetchedAssessments.some(a => a.managerScore !== null);
        const isDismissed = localStorage.getItem('assessmentNotificationDismissed') === 'true';
        setShowCompletedNotification(hasManagerScores && !isDismissed);

        setAssessments(fetchedAssessments);
      } catch (error) {
        console.error('Error checking completed assessments:', error);
      }
    };

    checkCompletedAssessments();
  }, [user]);

  useEffect(() => {
    const checkAssessmentRequests = async () => {
      if (!user || user.role !== 'manager') return;

      try {
        const response = await fetch(`/api/assessment-requests/manager?managerId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch requests');
        const requests: AssessmentRequest[] = await response.json();

        setAssessmentRequests(requests);

        const hasPendingRequests = requests.some(r => r.status === 'pending');
        const isDismissed = localStorage.getItem('requestNotificationDismissed') === 'true';
        setShowRequestNotification(hasPendingRequests && !isDismissed);
      } catch (error) {
        console.error('Error checking assessment requests:', error);
      }
    };

    checkAssessmentRequests();
  }, [user]);


  useEffect(() => {
    if (!assessments.length) return;

    try {
      const categoryScores: Record<string, { leader: number[], manager: number[] }> = {};
      Object.keys(categories).forEach(category => {
        categoryScores[category] = { leader: [], manager: [] };
      });

      assessments.forEach(assessment => {
        const category = Object.entries(categories).find(([_, ids]) =>
          ids.includes(assessment.questionId)
        )?.[0];

        if (category) {
          if (assessment.leaderScore !== null) {
            categoryScores[category].leader.push(assessment.leaderScore);
          }
          if (assessment.managerScore !== null) {
            categoryScores[category].manager.push(assessment.managerScore);
          }
        }
      });

      const leaderScores = Object.values(categoryScores).map(scores => {
        const avg = scores.leader.reduce((sum, score) => sum + score, 0);
        return scores.leader.length ? avg / scores.leader.length : 0;
      });

      const managerScores = Object.values(categoryScores).map(scores => {
        const avg = scores.manager.reduce((sum, score) => sum + score, 0);
        return scores.manager.length ? avg / scores.manager.length : 0;
      });

      const leaderTotal = assessments.filter(a => a.leaderScore !== null);
      const managerTotal = assessments.filter(a => a.managerScore !== null);

      const selfAssessmentScore = leaderTotal.length
        ? leaderTotal.reduce((sum, a) => sum + (a.leaderScore || 0), 0) / leaderTotal.length
        : 0;

      const managerAssessmentScore = managerTotal.length
        ? managerTotal.reduce((sum, a) => sum + (a.managerScore || 0), 0) / managerTotal.length
        : 0;

      const overallScore = (leaderTotal.length || managerTotal.length)
        ? (selfAssessmentScore + managerAssessmentScore) /
          ((leaderTotal.length && managerTotal.length) ? 2 : 1)
        : 0;

      const scorePercentage = (overallScore / 5) * 100;
      const currentLevel = calculateLeadershipLevel(overallScore);

      const gaps = assessments
        .filter(a => a.leaderScore !== null && a.managerScore !== null)
        .map(a => {
          const question = questions.find(q => q.id === a.questionId);
          if (!question) return null;

          const gap = Math.abs((a.leaderScore || 0) - (a.managerScore || 0));
          if (gap < 2) return null;

          return {
            category: question.category as "position" | "permission" | "production" | "people" | "pinnacle",
            question: question.text,
            leaderScore: a.leaderScore!,
            managerScore: a.managerScore!,
            gap
          };
        })
        .filter((gap): gap is Gap => gap !== null);

      setAssessmentData({
        leaderScores,
        managerScores,
        gaps,
        currentLevel,
        scorePercentage,
        overallScore,
        selfAssessmentScore,
        managerAssessmentScore
      });
    } catch (error) {
      console.error('Error processing assessment data:', error);
    }
  }, [assessments]);

  useEffect(() => {
    if (!assessments.length) return;

    try {
      const categoryQuestionsMap = new Map<string, Array<{
        id: number;
        text: string;
        leaderScore: number | null;
        managerScore: number | null;
      }>>();

      // Group questions by category
      Object.entries(categories).forEach(([category, questionIds]) => {
        const categoryQuestions = questionIds.map(id => {
          const assessment = assessments.find(a => a.questionId === id);
          const question = questions.find(q => q.id === id);
          return {
            id,
            text: question?.text || '',
            leaderScore: assessment?.leaderScore,
            managerScore: assessment?.managerScore
          };
        });
        categoryQuestionsMap.set(category, categoryQuestions);
      });

      // Calculate averages for each category
      const categoryScores = Object.entries(categories).map(([category, questionIds]) => {
        const categoryQuestions = categoryQuestionsMap.get(category) || [];
        const categoryAssessments = assessments.filter(a =>
          questionIds.includes(a.questionId)
        );

        const leaderScores = categoryAssessments
          .filter(a => a.leaderScore !== null)
          .map(a => a.leaderScore as number);

        const managerScores = categoryAssessments
          .filter(a => a.managerScore !== null)
          .map(a => a.managerScore as number);


        const allScores = [...leaderScores, ...managerScores];
        const avgScore = allScores.length > 0
          ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
          : 0;

        const avgLeaderScore = leaderScores.length > 0
          ? leaderScores.reduce((sum, score) => sum + score, 0) / leaderScores.length
          : 0;

        const avgManagerScore = managerScores.length > 0
          ? managerScores.reduce((sum, score) => sum + score, 0) / managerScores.length
          : 0;

        const gap = Math.abs(avgLeaderScore - avgManagerScore);

        return {
          category,
          questions: categoryQuestions,
          avgScore,
          gap,
          leaderScore: avgLeaderScore,
          managerScore: avgManagerScore
        };
      });

      // Sort and set category details
      setCategoryDetails({
        strengths: [...categoryScores]
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 3),
        opportunities: [...categoryScores]
          .sort((a, b) => a.avgScore - b.avgScore)
          .slice(0, 3),
        gaps: [...categoryScores]
          .filter(score => score.gap > 0)
          .sort((a, b) => b.gap - a.gap)
          .slice(0, 3)
      });

    } catch (error) {
      console.error('Error processing category details:', error);
    }
  }, [assessments]);

  const dismissCompletedNotification = () => {
    setShowCompletedNotification(false);
    localStorage.setItem('assessmentNotificationDismissed', 'true');
  };

  const dismissRequestNotification = () => {
    setShowRequestNotification(false);
    localStorage.setItem('requestNotificationDismissed', 'true');
  };

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

  const calculateLeadershipLevel = (totalScore: number) => {
    const maxPossibleScore = 5;
    const overallPercentage = (totalScore / maxPossibleScore) * 100;
    return leadershipLevels.find(
      level => overallPercentage >= level.range[0] && overallPercentage <= level.range[1]
    ) || leadershipLevels[0];
  };

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !showRequests) return;

      try {
        if (user.role === 'manager') {
          const response = await fetch(`/api/assessment-requests/manager?managerId=${user.id}`);
          if (!response.ok) throw new Error('Failed to fetch requests');
          const data = await response.json();
          setAssessmentRequests(data);
        } else if (user.role === 'leader' && searchTerm) {
          const response = await fetch(`/api/users?role=manager&search=${encodeURIComponent(searchTerm)}`);
          if (!response.ok) throw new Error('Failed to search managers');
          const data = await response.json();
          setManagers(data);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive"
        });
      }
    };

    fetchRequests();
  }, [user, showRequests, searchTerm]);

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
        <Alert className="relative">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Assessment Completed</AlertTitle>
          <AlertDescription className="pr-24">
            Your manager has completed their assessment. View your updated scores below.
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={dismissCompletedNotification}
            className="absolute right-4 top-4"
          >
            Got It!
          </Button>
        </Alert>
      )}

      {showRequestNotification && (
        <Alert className="relative">
          <Bell className="h-4 w-4" />
          <AlertTitle>New Assessment Requests</AlertTitle>
          <AlertDescription className="pr-24">
            You have pending leadership assessment requests to review.
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={dismissRequestNotification}
            className="absolute right-4 top-4"
          >
            Got It!
          </Button>
        </Alert>
      )}

      <Card
        className="bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
        onClick={() => setShowCalculation(true)}
      >
        <CardHeader>
          <CardTitle>Current Leadership Level</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{assessmentData.currentLevel.level}</h3>
                  <p className="text-muted-foreground">{assessmentData.currentLevel.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{assessmentData.overallScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
              </div>

              <LeadershipLevelBar currentScore={assessmentData.overallScore} />

              <div className="grid grid-cols-3 gap-8 py-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Self Assessment</p>
                  <p className="text-2xl font-bold">
                    {assessmentData.selfAssessmentScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Manager Assessment</p>
                  <p className="text-2xl font-bold">
                    {assessmentData.managerAssessmentScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Final Score</p>
                  <p className="text-2xl font-bold">
                    {assessmentData.overallScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Complete an assessment to see your leadership level</p>
          )}
        </CardContent>
      </Card>

      <LeadershipCalculationDialog
        open={showCalculation}
        onOpenChange={setShowCalculation}
        data={{
          ...assessmentData,
          currentLevel: {
            ...assessmentData.currentLevel,
            range: calculateLeadershipLevel(assessmentData.overallScore).range
          }
        }}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card
          className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
          onClick={() => setShowStrengths(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpIcon className="h-5 w-5 text-green-500" />
              <CardTitle>Top 3 Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {categoryDetails.strengths.map((strength, index) => (
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

        <Card
          className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
          onClick={() => setShowOpportunities(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowDownIcon className="h-5 w-5 text-orange-500" />
              <CardTitle>Top 3 Opportunities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {categoryDetails.opportunities.map((opportunity, index) => (
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

        <Card
          className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
          onClick={() => setShowGaps(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              <CardTitle>Top 3 Gaps</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {categoryDetails.gaps.map((gapItem, index) => (
              <div key={gapItem.category} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{index + 1}. {gapItem.category}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#2563eb] text-sm">
                      {(gapItem.leaderScore || 0).toFixed(1)}
                    </span>
                    <span className="text-blue-500 font-semibold">
                      {gapItem.gap.toFixed(1)}
                    </span>
                    <span className="text-[#dc2626] text-sm">
                      {(gapItem.managerScore || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <CategoryDetailsDialog
        open={showStrengths}
        onOpenChange={setShowStrengths}
        type="strengths"
        categoryScores={categoryDetails.strengths}
      />

      <CategoryDetailsDialog
        open={showOpportunities}
        onOpenChange={setShowOpportunities}
        type="opportunities"
        categoryScores={categoryDetails.opportunities}
      />

      <CategoryDetailsDialog
        open={showGaps}
        onOpenChange={setShowGaps}
        type="gaps"
        categoryScores={categoryDetails.gaps}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
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

        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle>Leadership Categories Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadershipCategoriesChart assessments={assessments} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {user?.role === 'manager' ? 'Assessment Requests' : 'Request Manager Assessment'}
            </DialogTitle>
          </DialogHeader>

          {user?.role === 'leader' ? (
            <div className="space-y-4">
              <Input
                placeholder="Search managers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ScrollArea className="h-[300px]">
                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className="flex items-center justify-between p-4 hover:bg-accent rounded-lg cursor-pointer"
                    onClick={() => requestManagerAssessment(manager.id)}
                  >
                    <div>
                      <p className="font-medium">{manager.name}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                    <Button size="sm">Request</Button>
                  </div>
                ))}
                {searchTerm && managers.length === 0 && (
                  <p className="text-center text-muted-foreground p-4">
                    No managers found
                  </p>
                )}
              </ScrollArea>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              {assessmentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{request.leader?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.leader?.project}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation(`/assessment/${request.leaderId}`)}
                  >
                    Start Assessment
                  </Button>
                </div>
              ))}
              {assessmentRequests.length === 0 && (
                <p className="text-center text-muted-foreground p-4">
                  No pending requests
                </p>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}