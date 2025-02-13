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
    title: "How to Develop Effective Leadership Skills (3 Secret Hacks)",
    description: "This video explores foundational leadership qualities, emphasizing the importance of character and integrity in building trust and credibility.",
    videoUrl: "https://www.youtube.com/watch?v=example1&autoplay=1"
  },
  "Communication & Influence": {
    title: "Let's Talk Core Leadership Skills: Increasing Persuasion & Influence",
    description: "Learn techniques to enhance your communication skills and increase your influence within your team and organization.",
    videoUrl: "https://www.youtube.com/watch?v=example2&autoplay=1"
  },
  "Vision & Strategic Thinking": {
    title: "Building Effective Leadership Skills for Strategic Success",
    description: "This video provides insights into developing a strategic mindset and crafting a compelling vision to guide your team.",
    videoUrl: "https://www.youtube.com/watch?v=example3&autoplay=1"
  },
  "Accountability & Decision-Making": {
    title: "Fostering Accountability in the Workplace | FranklinCovey",
    description: "Explore strategies to build a culture of accountability and improve decision-making processes within your team.",
    videoUrl: "https://www.youtube.com/watch?v=example4&autoplay=1"
  },
  "Emotional Intelligence & Relationships": {
    title: "Building Confidence, Emotional Intelligence, and Leadership Abilities",
    description: "Enhance your emotional intelligence to build stronger relationships and lead more effectively.",
    videoUrl: "https://www.youtube.com/watch?v=example5&autoplay=1"
  },
  "Coaching & Development": {
    title: "Management vs Leadership: How Coaching Skills Make a Difference",
    description: "Understand the distinction between management and leadership, and learn how coaching can enhance team development.",
    videoUrl: "https://www.youtube.com/watch?v=example6&autoplay=1"
  },
  "Motivation & Team Culture": {
    title: "How to Own Your Leadership Role | Boost Confidence & Team Trust",
    description: "Discover ways to embrace your leadership role to motivate your team and foster a positive culture.",
    videoUrl: "https://www.youtube.com/watch?v=example7&autoplay=1"
  },
  "Execution & Results": {
    title: "How to Develop Effective Leadership Skills (3 Secret Hacks)",
    description: "Focus on practical strategies to improve execution and achieve desired results within your team.",
    videoUrl: "https://www.youtube.com/watch?v=example8&autoplay=1"
  },
  "Innovation & Adaptability": {
    title: "Building Effective Leadership Skills for Strategic Success",
    description: "Learn how to foster innovation and adaptability to stay ahead in a dynamic environment.",
    videoUrl: "https://www.youtube.com/watch?v=example9&autoplay=1"
  },
  "Reputation & Influence": {
    title: "Let's Talk Core Leadership Skills: Increasing Persuasion & Influence",
    description: "Explore methods to enhance your influence and build a strong reputation beyond your immediate organization.",
    videoUrl: "https://www.youtube.com/watch?v=example10&autoplay=1"
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