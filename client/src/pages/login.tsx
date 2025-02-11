import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  role: z.enum(["leader", "manager"])
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onLogin = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive"
      });
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await register(data.email, data.password, data.name, data.role);
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Leadership Assessment Tool</h1>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...loginForm.register("email")}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...loginForm.register("password")}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...registerForm.register("email")}
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    {...registerForm.register("name")}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...registerForm.register("password")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={registerForm.watch("role") === "leader" ? "default" : "outline"}
                    onClick={() => registerForm.setValue("role", "leader")}
                    className="w-full"
                  >
                    Leader
                  </Button>
                  <Button
                    type="button"
                    variant={registerForm.watch("role") === "manager" ? "default" : "outline"}
                    onClick={() => registerForm.setValue("role", "manager")}
                    className="w-full"
                  >
                    Manager
                  </Button>
                </div>
                <Button type="submit" className="w-full">
                  Register
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}