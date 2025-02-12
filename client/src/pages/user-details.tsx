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

      queryClient.invalidateQueries([`/api/assessments/${userId}`]);

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

  const selfAssessments = assessments?.filter(a => a.leaderScore !== null) || [];
  const managerAssessments = assessments?.filter(a => a.managerScore !== null) || [];

  const AssessmentTable = ({ assessments, type }: { assessments: Assessment[], type: 'self' | 'manager' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question ID</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assessments.map((assessment) => (
          <TableRow key={assessment.id}>
            <TableCell>{assessment.questionId}</TableCell>
            <TableCell>
              {type === 'self' ? assessment.leaderScore : assessment.managerScore}
            </TableCell>
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
                      Are you sure you want to delete this assessment? This action cannot be undone.
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
        {assessments.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              No {type === 'self' ? 'self' : 'manager'} assessments completed
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

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
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="self" className="space-y-4">
            <TabsList>
              <TabsTrigger value="self">Self Assessments</TabsTrigger>
              <TabsTrigger value="manager">Manager Assessments</TabsTrigger>
            </TabsList>

            <TabsContent value="self">
              <AssessmentTable assessments={selfAssessments} type="self" />
            </TabsContent>

            <TabsContent value="manager">
              <AssessmentTable assessments={managerAssessments} type="manager" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}