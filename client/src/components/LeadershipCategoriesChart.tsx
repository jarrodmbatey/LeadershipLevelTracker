import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { questions } from "@shared/schema";

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

interface LeadershipCategoriesChartProps {
  assessments: Array<{
    questionId: number;
    leaderScore: number | null;
    managerScore: number | null;
  }>;
}

export default function LeadershipCategoriesChart({ assessments }: LeadershipCategoriesChartProps) {
  const categoryScores = Object.entries(categories).map(([category, questionIds]) => {
    const categoryAssessments = assessments.filter(a => questionIds.includes(a.questionId));

    const leaderScores = categoryAssessments
      .filter(a => a.leaderScore !== null)
      .map(a => a.leaderScore as number);

    const managerScores = categoryAssessments
      .filter(a => a.managerScore !== null)
      .map(a => a.managerScore as number);

    const avgLeaderScore = leaderScores.length > 0
      ? leaderScores.reduce((acc, score) => acc + score, 0) / leaderScores.length
      : 0;

    const avgManagerScore = managerScores.length > 0
      ? managerScores.reduce((acc, score) => acc + score, 0) / managerScores.length
      : 0;

    return {
      category,
      leaderScore: Number(avgLeaderScore.toFixed(2)),
      managerScore: Number(avgManagerScore.toFixed(2))
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={categoryScores} 
        margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="category" 
          angle={-45} 
          textAnchor="end" 
          height={100}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Bar 
          name="Self Assessment" 
          dataKey="leaderScore" 
          fill="#2563eb" 
          opacity={0.6}
        />
        <Bar 
          name="Manager Assessment" 
          dataKey="managerScore" 
          fill="#dc2626" 
          opacity={0.6}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}