import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScoreChart from "@/components/ScoreChart";
import GapAnalysis from "@/components/GapAnalysis";
import { Button } from "@/components/ui/button";
import { questions } from "@shared/schema";

interface Assessment {
  id: string;
  questionId: number;
  leaderScore: number;
  managerScore: number;
}

interface Gap {
  category: string;
  question: string;
  leaderScore: number;
  managerScore: number;
  gap: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [assessmentData, setAssessmentData] = useState<{
    leaderScores: number[];
    managerScores: number[];
    gaps: Gap[];
  }>({
    leaderScores: [0, 0, 0],
    managerScores: [0, 0, 0],
    gaps: []
  });

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;

      const assessmentsRef = collection(db, "assessments");
      const q = query(assessmentsRef, 
        user.role === "leader" 
          ? where("leaderId", "==", user.id)
          : where("managerId", "==", user.id)
      );

      const querySnapshot = await getDocs(q);
      const assessments: Assessment[] = [];
      querySnapshot.forEach((doc) => {
        assessments.push({ id: doc.id, ...doc.data() } as Assessment);
      });

      // Calculate scores and gaps
      const categoryScores = {
        positional: { leader: [] as number[], manager: [] as number[] },
        permission: { leader: [] as number[], manager: [] as number[] },
        production: { leader: [] as number[], manager: [] as number[] }
      };

      assessments.forEach(assessment => {
        const question = questions.find(q => q.id === assessment.questionId);
        if (question) {
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

      // Find significant gaps (2+ points difference)
      const significantGaps = assessments
        .filter(a => Math.abs(a.leaderScore - a.managerScore) >= 2)
        .map(a => {
          const question = questions.find(q => q.id === a.questionId);
          return {
            category: question?.category || "",
            question: question?.text || "",
            leaderScore: a.leaderScore,
            managerScore: a.managerScore,
            gap: Math.abs(a.leaderScore - a.managerScore)
          };
        });

      setAssessmentData({
        leaderScores,
        managerScores,
        gaps: significantGaps
      });
    };

    fetchAssessments();
  }, [user]);

  const generatePDF = () => {
    // TODO: Implement PDF generation using jsPDF
    console.log("Generating PDF...");
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leadership Assessment Dashboard</h1>
        <Button onClick={generatePDF}>Download Report</Button>
      </div>

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