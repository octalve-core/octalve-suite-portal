import { AuthShell } from "../components/AuthShell";
import { LoginForm } from "./LoginForm";

export function LoginScreen() {
  return (
    <AuthShell
      mode="login"
      title="Sign in"
      subtitle="Please login to continue to your workspace."
    >
      <LoginForm />
    </AuthShell>
  );
}
