import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AssessmentSession {
  sessionDate: string;
  leaderScores: number[];
  managerScores: number[];
  assessmentIds: number[];
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

  const deleteAssessmentSession = async (assessmentIds: number[]) => {
    try {
      // Delete all assessments in the session
      await Promise.all(
        assessmentIds.map(id =>
          fetch(`/api/assessments/${id}`, {
            method: 'DELETE',
          })
        )
      );

      await queryClient.invalidateQueries([`/api/assessments/${userId}`]);

      toast({
        title: "Assessment session deleted",
        description: "The assessment session has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting assessment session:', error);
      toast({
        title: "Error",
        description: "Failed to delete the assessment session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user || user.role !== "admin" || !userId) return null;
  if (isLoadingUser || isLoadingAssessments) return <div>Loading...</div>;
  if (!userDetails) return <div>User not found</div>;

  // Group assessments by session (date)
  const sessionMap = new Map<string, AssessmentSession>();

  assessments?.forEach(assessment => {
    const sessionDate = new Date(assessment.completedAt).toISOString().split('T')[0];

    if (!sessionMap.has(sessionDate)) {
      sessionMap.set(sessionDate, {
        sessionDate,
        leaderScores: [],
        managerScores: [],
        assessmentIds: []
      });
    }

    const session = sessionMap.get(sessionDate)!;
    session.assessmentIds.push(assessment.id);

    if (assessment.leaderScore !== null) {
      session.leaderScores.push(assessment.leaderScore);
    }
    if (assessment.managerScore !== null) {
      session.managerScores.push(assessment.managerScore);
    }
  });

  const assessmentSessions = Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  const calculateAverageScore = (scores: number[]) => {
    if (scores.length === 0) return "Not submitted";
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

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
          <CardTitle>Assessment Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Date</TableHead>
                <TableHead>Self Assessment Average</TableHead>
                <TableHead>Manager Assessment Average</TableHead>
                <TableHead>Questions Answered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentSessions.map((session) => (
                <TableRow key={session.sessionDate}>
                  <TableCell>
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{calculateAverageScore(session.leaderScores)}</TableCell>
                  <TableCell>{calculateAverageScore(session.managerScores)}</TableCell>
                  <TableCell>
                    {session.leaderScores.length + session.managerScores.length} questions
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
                          <AlertDialogTitle>Delete Assessment Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this entire assessment session from {new Date(session.sessionDate).toLocaleDateString()}? This will remove all self-assessment and manager assessment scores from this session. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAssessmentSession(session.assessmentIds)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {assessmentSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No assessment sessions found
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