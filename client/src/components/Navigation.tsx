import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            {user.role === 'admin' && (
              <Link href="/admin" className="text-gray-900 hover:text-gray-700">
                Admin Portal
              </Link>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={logout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}