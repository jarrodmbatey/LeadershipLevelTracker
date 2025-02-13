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
                            {category.leaderScore?.toFixed(1) ?? 'N/A'}
                          </span>
                          <span className="text-blue-500 font-semibold">
                            {category.gap?.toFixed(1)}
                          </span>
                          <span className="text-[#dc2626] text-sm">
                            {category.managerScore?.toFixed(1) ?? 'N/A'}
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
                        <p className="mb-2">{question.text}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Self Assessment</p>
                            <p className="text-lg font-semibold text-[#2563eb]">
                              {question.leaderScore?.toFixed(1) ?? 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Manager Assessment</p>
                            <p className="text-lg font-semibold text-[#dc2626]">
                              {question.managerScore?.toFixed(1) ?? 'N/A'}
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
