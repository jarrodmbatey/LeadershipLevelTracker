import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface LeadershipCalculationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    selfAssessmentScore: number;
    managerAssessmentScore: number;
    overallScore: number;
    scorePercentage: number;
    currentLevel: {
      level: string;
      description: string;
      range: [number, number];
    };
  };
}

export default function LeadershipCalculationDialog({
  open,
  onOpenChange,
  data
}: LeadershipCalculationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Leadership Level Calculation Breakdown</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Raw Scores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Self Assessment</p>
                    <p className="text-2xl font-bold">{data.selfAssessmentScore.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manager Assessment</p>
                    <p className="text-2xl font-bold">{data.managerAssessmentScore.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Overall Score Calculation</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    1. Combined Score = (Self Assessment + Manager Assessment) ÷ 2
                  </p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    ({data.selfAssessmentScore.toFixed(2)} + {data.managerAssessmentScore.toFixed(2)}) ÷ 2 = {data.overallScore.toFixed(2)}
                  </p>
                  <p className="text-sm mt-4">
                    2. Percentage Score = (Overall Score ÷ 5) × 100
                  </p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    ({data.overallScore.toFixed(2)} ÷ 5) × 100 = {data.scorePercentage.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Leadership Level Determination</h3>
                <p className="text-sm mb-4">
                  Your score of {data.scorePercentage.toFixed(1)}% falls within the {data.currentLevel.level} range ({data.currentLevel.range[0]}% - {data.currentLevel.range[1]}%)
                </p>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Level Ranges:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className={`p-2 rounded ${data.currentLevel.level.includes("Position") ? "bg-primary/10" : ""}`}>
                      Position (Rights): 1-39% - Authority and formal leadership role
                    </li>
                    <li className={`p-2 rounded ${data.currentLevel.level.includes("Permission") ? "bg-primary/10" : ""}`}>
                      Permission (Relationships): 40-59% - Building trust and influence
                    </li>
                    <li className={`p-2 rounded ${data.currentLevel.level.includes("Production") ? "bg-primary/10" : ""}`}>
                      Production (Results): 60-79% - Driving outcomes and achievements
                    </li>
                    <li className={`p-2 rounded ${data.currentLevel.level.includes("People Development") ? "bg-primary/10" : ""}`}>
                      People Development (Reproduction): 80-94% - Developing and empowering others
                    </li>
                    <li className={`p-2 rounded ${data.currentLevel.level.includes("Pinnacle") ? "bg-primary/10" : ""}`}>
                      Pinnacle (Legacy & Influence): 95-100% - Creating lasting impact
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
