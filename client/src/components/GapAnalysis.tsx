import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GapAnalysisProps {
  gaps: Array<{
    category: string;
    question: string;
    leaderScore: number;
    managerScore: number;
    gap: number;
  }>;
}

export default function GapAnalysis({ gaps }: GapAnalysisProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Question</TableHead>
          <TableHead>Leader Score</TableHead>
          <TableHead>Manager Score</TableHead>
          <TableHead>Gap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gaps.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.category}</TableCell>
            <TableCell>{item.question}</TableCell>
            <TableCell>{item.leaderScore}</TableCell>
            <TableCell>{item.managerScore}</TableCell>
            <TableCell className="font-medium">
              {item.gap}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
