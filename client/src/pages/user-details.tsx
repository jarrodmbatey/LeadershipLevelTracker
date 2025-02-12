import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const userId = parseInt(params.userId);

  const { data: userDetails, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: [`/api/assessments/${userId}`],
    enabled: !!userId,
  });

  if (!user || user.role !== "admin") return null;
  if (isLoadingUser || isLoadingAssessments) return <div>Loading...</div>;
  if (!userDetails) return <div>User not found</div>;

  const selfAssessments = assessments?.filter(a => a.leaderScore !== null) || [];
  const managerAssessments = assessments?.filter(a => a.managerScore !== null) || [];

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selfAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.questionId}</TableCell>
                      <TableCell>{assessment.leaderScore}</TableCell>
                      <TableCell>
                        {new Date(assessment.completedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {selfAssessments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No self-assessments completed
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="manager">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managerAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.questionId}</TableCell>
                      <TableCell>{assessment.managerScore}</TableCell>
                      <TableCell>
                        {new Date(assessment.completedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {managerAssessments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No manager assessments completed
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
