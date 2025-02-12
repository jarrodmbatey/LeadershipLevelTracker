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
import { Badge } from "@/components/ui/badge"; // Added import for Badge
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
  sessionType: 'Self' | 'Manager';
  averageScore: number;
  questionsAnswered: number;
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
      await Promise.all(
        assessmentIds.map(id =>
          fetch(`/api/assessments/${id}`, {
            method: 'DELETE',
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${userId}`] });

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

  // Group assessments by session date and type (leader/manager)
  const sessionMap = new Map<string, AssessmentSession[]>();

  assessments?.forEach(assessment => {
    // Create a unique session identifier based on date and score type
    const sessionDate = new Date(assessment.completedAt).toISOString().split('T')[0];
    const hasLeaderScore = assessment.leaderScore !== null;
    const hasManagerScore = assessment.managerScore !== null;

    // Handle leader scores (self assessment)
    if (hasLeaderScore) {
      const sessionKey = `${sessionDate}-self`;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, []);
      }
      const sessions = sessionMap.get(sessionKey)!;
      if (!sessions.length || sessions[sessions.length - 1].questionsAnswered >= 50) {
        sessions.push({
          sessionDate,
          sessionType: 'Self',
          averageScore: 0,
          questionsAnswered: 0,
          assessmentIds: []
        });
      }
      const currentSession = sessions[sessions.length - 1];
      currentSession.assessmentIds.push(assessment.id);
      currentSession.averageScore = ((currentSession.averageScore * currentSession.questionsAnswered) + assessment.leaderScore) / (currentSession.questionsAnswered + 1);
      currentSession.questionsAnswered += 1;
    }

    // Handle manager scores
    if (hasManagerScore) {
      const sessionKey = `${sessionDate}-manager`;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, []);
      }
      const sessions = sessionMap.get(sessionKey)!;
      if (!sessions.length || sessions[sessions.length - 1].questionsAnswered >= 50) {
        sessions.push({
          sessionDate,
          sessionType: 'Manager',
          averageScore: 0,
          questionsAnswered: 0,
          assessmentIds: []
        });
      }
      const currentSession = sessions[sessions.length - 1];
      currentSession.assessmentIds.push(assessment.id);
      currentSession.averageScore = ((currentSession.averageScore * currentSession.questionsAnswered) + assessment.managerScore) / (currentSession.questionsAnswered + 1);
      currentSession.questionsAnswered += 1;
    }
  });

  // Flatten and sort all sessions
  const assessmentSessions = Array.from(sessionMap.values())
    .flat()
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

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
                <TableHead>Type</TableHead>
                <TableHead>Average Score</TableHead>
                <TableHead>Questions Answered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentSessions.map((session, index) => (
                <TableRow key={`${session.sessionDate}-${session.sessionType}-${index}`}>
                  <TableCell>
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.sessionType === 'Self' ? "default" : "secondary"}>
                      {session.sessionType} Assessment
                    </Badge>
                  </TableCell>
                  <TableCell>{session.averageScore.toFixed(2)}</TableCell>
                  <TableCell>{session.questionsAnswered} questions</TableCell>
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
                            Are you sure you want to delete this {session.sessionType.toLowerCase()} assessment session from {new Date(session.sessionDate).toLocaleDateString()}? This action will remove all {session.questionsAnswered} question responses from this session and cannot be undone.
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