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

// Add the categories mapping from LeadershipCategoriesChart
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

// Add leadership levels definition
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
  const [assessmentData, setAssessmentData] = useState<{
    leaderScores: number[];
    managerScores: number[];
    gaps: Gap[];
  }>({
    leaderScores: [0, 0, 0, 0, 0],
    managerScores: [0, 0, 0, 0, 0],
    gaps: []
  });
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    const checkCompletedAssessments = async () => {
      if (!user || user.role !== 'leader') return;

      try {
        const response = await fetch(`/api/assessments/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const assessments: Assessment[] = await response.json();
        setAssessments(assessments);

        const hasManagerScores = assessments.some(a => a.managerScore !== null);
        setShowCompletedNotification(hasManagerScores);
      } catch (error) {
        console.error('Error checking completed assessments:', error);
      }
    };

    checkCompletedAssessments();
  }, [user]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !showRequests) return;

      try {
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

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/assessments/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const assessments: Assessment[] = await response.json();
        setAssessments(assessments);

        const categoryScores = {};
        Object.keys(categories).forEach(key => {
          categoryScores[key] = { leader: [] as number[], manager: [] as number[] };
        })

        assessments.forEach(assessment => {
          const question = questions.find(q => q.id === assessment.questionId);
          if (!question) return;

          const category = Object.entries(categories).find(([cat, ids]) => ids.includes(assessment.questionId))?.[0];
          if (category && assessment.leaderScore) {
            categoryScores[category].leader.push(assessment.leaderScore);
          }
          if (category && assessment.managerScore) {
            categoryScores[category].manager.push(assessment.managerScore);
          }
        });

        const leaderScores = Object.keys(categoryScores).map(category => {
          const scores = categoryScores[category].leader;
          return scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
        });

        const managerScores = Object.keys(categoryScores).map(category => {
          const scores = categoryScores[category].manager;
          return scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
        });


        const significantGaps = assessments
          .filter(a => a.leaderScore !== null && a.managerScore !== null)
          .map(a => {
            const question = questions.find(q => q.id === a.questionId);
            if (!question || !a.leaderScore || !a.managerScore) return null;

            const gap = Math.abs(a.leaderScore - a.managerScore);
            if (gap < 2) return null;

            const category = Object.entries(categories).find(([cat, ids]) => ids.includes(a.questionId))?.[0];
            return category ? {
              category: category,
              question: question.text,
              leaderScore: a.leaderScore,
              managerScore: a.managerScore,
              gap
            } : null;
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

  // Calculate leadership level
  const calculateLeadershipLevel = (totalScore: number) => {
    const maxPossibleScore = 5; // Max score per question
    const overallPercentage = (totalScore / maxPossibleScore) * 100;
    return leadershipLevels.find(
      level => overallPercentage >= level.range[0] && overallPercentage <= level.range[1]
    ) || leadershipLevels[0]; // Default to first level if no match
  };

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

      {/* Add Leadership Level Card */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Current Leadership Level</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const averageScore = assessments.reduce((acc, curr) => {
                  const scores = [];
                  if (curr.leaderScore !== null) scores.push(curr.leaderScore);
                  if (curr.managerScore !== null) scores.push(curr.managerScore);
                  return acc + (scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1));
                }, 0) / assessments.length;

                const currentLevel = calculateLeadershipLevel(averageScore);

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{currentLevel.level}</h3>
                        <p className="text-muted-foreground">{currentLevel.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{((averageScore / 5) * 100).toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-primary/20">
                        <div
                          style={{ width: `${(averageScore / 5) * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        ></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-muted-foreground">Complete an assessment to see your leadership level</p>
          )}
        </CardContent>
      </Card>

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
                {(assessments
                  .filter(a => a.leaderScore !== null)
                  .reduce((acc, curr) => acc + (curr.leaderScore || 0), 0) /
                  assessments.filter(a => a.leaderScore !== null).length || 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Manager Assessment Score</p>
              <p className="text-2xl font-bold">
                {(assessments
                  .filter(a => a.managerScore !== null)
                  .reduce((acc, curr) => acc + (curr.managerScore || 0), 0) /
                  assessments.filter(a => a.managerScore !== null).length || 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Final Leadership Score</p>
              <p className="text-2xl font-bold">
                {((
                  (assessments
                    .filter(a => a.leaderScore !== null)
                    .reduce((acc, curr) => acc + (curr.leaderScore || 0), 0) /
                    assessments.filter(a => a.leaderScore !== null).length || 0) +
                  (assessments
                    .filter(a => a.managerScore !== null)
                    .reduce((acc, curr) => acc + (curr.managerScore || 0), 0) /
                    assessments.filter(a => a.managerScore !== null).length || 0)
                ) / 2).toFixed(1)}
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