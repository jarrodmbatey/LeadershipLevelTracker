import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/auth";

interface UserDetailsProps {
  params: {
    userId: string;
  };
}

interface Assessment {
  id: number;
  questionId: number;
  leaderScore: number | null;
  managerScore: number | null;
  completedAt: string;
}

export default function UserDetails({ params }: UserDetailsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = params?.userId ? parseInt(params.userId) : null;

  const { data: userDetails, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: [`/api/assessments/${userId}`],
    enabled: !!userId,
  });

  const deleteAssessment = async (assessmentId: number) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      await queryClient.invalidateQueries([`/api/assessments/${userId}`]);

      toast({
        title: "Assessment deleted",
        description: "The assessment has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete the assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user || user.role !== "admin" || !userId) return null;
  if (isLoadingUser || isLoadingAssessments) return <div>Loading...</div>;
  if (!userDetails) return <div>User not found</div>;

  // Group assessments by question ID
  const groupedAssessments = assessments?.reduce((acc, assessment) => {
    if (!acc[assessment.questionId]) {
      acc[assessment.questionId] = {
        questionId: assessment.questionId,
        id: assessment.id,
        leaderScore: assessment.leaderScore,
        managerScore: assessment.managerScore,
        completedAt: assessment.completedAt
      };
    } else {
      if (assessment.leaderScore !== null) {
        acc[assessment.questionId].leaderScore = assessment.leaderScore;
      }
      if (assessment.managerScore !== null) {
        acc[assessment.questionId].managerScore = assessment.managerScore;
      }
    }
    return acc;
  }, {} as Record<number, Assessment>) || {};

  const assessmentsList = Object.values(groupedAssessments);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{userDetails.name}'s Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1">{userDetails.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 capitalize">{userDetails.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1">{userDetails.project}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Joined</dt>
              <dd className="mt-1">
                {userDetails.createdAt
                  ? new Date(userDetails.createdAt).toLocaleDateString()
                  : "N/A"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question ID</TableHead>
                <TableHead>Self Score</TableHead>
                <TableHead>Manager Score</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentsList.map((assessment) => (
                <TableRow key={assessment.questionId}>
                  <TableCell>{assessment.questionId}</TableCell>
                  <TableCell>{assessment.leaderScore ?? "Not submitted"}</TableCell>
                  <TableCell>{assessment.managerScore ?? "Not submitted"}</TableCell>
                  <TableCell>
                    {new Date(assessment.completedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this entire assessment record? This will remove both the self-assessment and manager assessment scores for this question. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAssessment(assessment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {assessmentsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No assessments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}