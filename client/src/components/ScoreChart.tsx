import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";

interface ScoreChartProps {
  leaderScores: number[];
  managerScores: number[];
}

export default function ScoreChart({ leaderScores, managerScores }: ScoreChartProps) {
  const data = [
    {
      category: "Positional",
      leader: leaderScores[0],
      manager: managerScores[0]
    },
    {
      category: "Permission",
      leader: leaderScores[1],
      manager: managerScores[1]
    },
    {
      category: "Production",
      leader: leaderScores[2],
      manager: managerScores[2]
    }
  ];

  return (
    <RadarChart
      width={500}
      height={400}
      data={data}
      className="mx-auto"
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="category" />
      <PolarRadiusAxis angle={30} domain={[0, 5]} />
      <Radar
        name="Leader Score"
        dataKey="leader"
        stroke="#2563eb"
        fill="#2563eb"
        fillOpacity={0.6}
      />
      <Radar
        name="Manager Score"
        dataKey="manager"
        stroke="#dc2626"
        fill="#dc2626"
        fillOpacity={0.6}
      />
      <Legend />
    </RadarChart>
  );
}
