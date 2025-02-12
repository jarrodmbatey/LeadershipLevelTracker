import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface ScoreChartProps {
  leaderScores: number[];
  managerScores: number[];
}

export default function ScoreChart({ leaderScores, managerScores }: ScoreChartProps) {
  const data = [
    {
      category: "Position",
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
    },
    {
      category: "People Development",
      leader: leaderScores[3],
      manager: managerScores[3]
    },
    {
      category: "Pinnacle",
      leader: leaderScores[4],
      manager: managerScores[4]
    }
  ];

  return (
    <RadarChart
      width={600}
      height={500}
      data={data}
      className="mx-auto"
    >
      <PolarGrid />
      <PolarAngleAxis 
        dataKey="category" 
        tick={{ fontSize: 12 }}
        tickLine={false}
      />
      <PolarRadiusAxis 
        angle={90} 
        domain={[0, 5]} 
        tickCount={6}
      />
      <Radar
        name="Self Assessment"
        dataKey="leader"
        stroke="#2563eb"
        fill="#2563eb"
        fillOpacity={0.6}
      />
      <Radar
        name="Manager Assessment"
        dataKey="manager"
        stroke="#dc2626"
        fill="#dc2626"
        fillOpacity={0.6}
      />
    </RadarChart>
  );
}