import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useConnectionSession } from "@/hooks/useConnection";

export function AuthButton() {
  const signedIn = useConnectionSession();
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (!signedIn) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/login"><LogIn className="h-4 w-4" />Sign in</Link>
      </Button>
    );
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.removeQueries({ queryKey: ["latest-summary"] });
    await supabase.auth.signOut();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <Button size="sm" variant="outline" onClick={() => void signOut()}>
      <LogOut className="h-4 w-4" />Sign out
    </Button>
  );
}
