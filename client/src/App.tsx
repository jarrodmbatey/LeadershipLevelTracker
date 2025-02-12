import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useAuth } from "./lib/auth";
import Navigation from "./components/Navigation";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Assessment from "./pages/assessment";
import SelfAssessment from "./pages/self-assessment";
import Admin from "./pages/admin";
import UserDetails from "./pages/user-details";
import NotFound from "./pages/not-found";

function PrivateRoute({ component: Component, params }: { component: any; params?: any }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return <Component {...params} />;
}

function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/dashboard">
              {() => <PrivateRoute component={Dashboard} />}
            </Route>
            <Route path="/assessment/:leaderId">
              {(params) => <PrivateRoute component={Assessment} params={params} />}
            </Route>
            <Route path="/self-assessment">
              {() => <PrivateRoute component={SelfAssessment} />}
            </Route>
            <Route path="/admin">
              {() => <PrivateRoute component={Admin} />}
            </Route>
            <Route path="/user/:userId">
              {(params) => <PrivateRoute component={UserDetails} params={params} />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;