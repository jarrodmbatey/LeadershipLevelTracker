import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface CategoryDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'strengths' | 'opportunities' | 'gaps';
  categoryScores: Array<{
    category: string;
  }>;
}

const resources = {
  "Character & Integrity": {
    title: "Qualities Of A Good Leader: Character, Integrity, and Consistency",
    description: "This video discusses the essential qualities of a good leader, emphasizing character, integrity, and consistency.",
    videoUrl: "https://www.youtube.com/watch?v=ABuTudrsj2w&autoplay=1"
  },
  "Communication & Influence": {
    title: "The Key to Powerful Leadership Communication",
    description: "Gregg Thompson, President of Bluepoint Leadership Development, dispels myths about communication and identifies key practices for leaders.",
    videoUrl: "https://www.youtube.com/watch?v=em6EJ7-MFcw&autoplay=1"
  },
  "Vision & Strategic Thinking": {
    title: "Building Effective Leadership Skills for Strategic Success",
    description: "This video provides insights into developing a strategic mindset and crafting a compelling vision to guide your team.",
    videoUrl: "https://www.youtube.com/watch?v=54yErXuNJLM&autoplay=1"
  },
  "Accountability & Decision-Making": {
    title: "Fostering Accountability in the Workplace | FranklinCovey",
    description: "Explore strategies to build a culture of accountability and improve decision-making processes within your team.",
    videoUrl: "https://youtu.be/TM5w0N8_VJg?si=q5H_kAm21jVGyhaH&autoplay=1"
  },
  "Emotional Intelligence & Relationships": {
    title: "Building Confidence, Emotional Intelligence, and Leadership Abilities",
    description: "Enhance your emotional intelligence to build stronger relationships and lead more effectively.",
    videoUrl: "https://www.youtube.com/watch?v=Mv2RcidxbhI&autoplay=1"
  },
  "Coaching & Development": {
    title: "Management vs Leadership: How Coaching Skills Make a Difference",
    description: "Understand the distinction between management and leadership, and learn how coaching can enhance team development.",
    videoUrl: "https://www.youtube.com/watch?v=mZqjOf9N9jw&autoplay=1"
  },
  "Motivation & Team Culture": {
    title: "Building a Positive Team Culture",
    description: "Steps to create and maintain a healthy and productive team environment.",
    videoUrl: "https://www.youtube.com/watch?v=example20&autoplay=1"
  },
  "Execution & Results": {
    title: "Becoming a Results-Driven Leader",
    description: "Focusing on outcomes and driving your team towards achieving them.",
    videoUrl: "https://www.youtube.com/watch?v=R9MI4xmTukU&autoplay=1"
  },
  "Innovation & Adaptability": {
    title: "Fostering Innovation in Your Team",
    description: "Encouraging creativity and new ideas within your team.",
    videoUrl: "https://www.youtube.com/watch?v=example26&autoplay=1"
  },
  "Reputation & Influence": {
    title: "Creating a Lasting Impact as a Leader",
    description: "Ways to leave a positive and enduring influence on your team and organization.",
    videoUrl: "https://youtu.be/y2VU_euFK9Y?si=lVZ5QCSiBauWN0wC&autoplay=1"
  }
} as const;

export default function CategoryDetailsDialog({
  open,
  onOpenChange,
  type,
  categoryScores
}: CategoryDetailsDialogProps) {
  const getTitle = () => {
    switch (type) {
      case 'strengths':
        return 'Recommended Resources for Your Strengths';
      case 'opportunities':
        return 'Resources to Help You Grow';
      case 'gaps':
        return 'Resources to Bridge the Gaps';
      default:
        return '';
    }
  };

  const handleWatchVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {categoryScores.map((category, index) => {
              const resource = resources[category.category as keyof typeof resources];
              if (!resource) return null;

              return (
                <Card key={category.category}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {index + 1}. {category.category}
                        </h3>
                        <h4 className="text-base font-medium text-muted-foreground mb-2">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {resource.description}
                        </p>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => handleWatchVideo(resource.videoUrl)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Watch Video
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}