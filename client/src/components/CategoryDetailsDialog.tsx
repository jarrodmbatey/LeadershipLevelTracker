import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'strengths' | 'opportunities' | 'gaps';
  categoryScores: Array<{
    category: string;
    questions: Array<{
      id: number;
      text: string;
      leaderScore: number | null;
      managerScore: number | null;
    }>;
    avgScore: number;
    gap?: number;
    leaderScore?: number;
    managerScore?: number;
  }>;
}

export default function CategoryDetailsDialog({
  open,
  onOpenChange,
  type,
  categoryScores
}: CategoryDetailsDialogProps) {
  const getTitle = () => {
    switch (type) {
      case 'strengths':
        return 'Top 3 Strengths Breakdown';
      case 'opportunities':
        return 'Top 3 Areas for Growth';
      case 'gaps':
        return 'Top 3 Perception Gaps';
      default:
        return '';
    }
  };

  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return 'No Score';
    }
    return score.toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {categoryScores.map((category, index) => (
              <Card key={category.category}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {index + 1}. {category.category}
                    </h3>
                    <div className="flex items-center gap-2">
                      {type === 'gaps' ? (
                        <>
                          <span className="text-[#2563eb] text-sm">
                            {formatScore(category.leaderScore)}
                          </span>
                          <span className="text-blue-500 font-semibold">
                            {formatScore(category.gap)}
                          </span>
                          <span className="text-[#dc2626] text-sm">
                            {formatScore(category.managerScore)}
                          </span>
                        </>
                      ) : (
                        <span className={`font-semibold ${
                          type === 'strengths' ? 'text-green-500' : 'text-orange-500'
                        }`}>
                          {category.avgScore.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {category.questions.map(question => (
                      <div key={question.id} className="p-4 bg-muted rounded-lg">
                        <p className="mb-2 font-medium">{question.text}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="p-2 rounded bg-background/50">
                            <p className="text-sm text-muted-foreground">Self Assessment</p>
                            <p className="text-lg font-semibold text-[#2563eb]">
                              {formatScore(question.leaderScore)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-background/50">
                            <p className="text-sm text-muted-foreground">Manager Assessment</p>
                            <p className="text-lg font-semibold text-[#dc2626]">
                              {formatScore(question.managerScore)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}