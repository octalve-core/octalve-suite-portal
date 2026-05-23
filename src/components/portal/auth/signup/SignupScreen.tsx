import { AuthShell } from "../components/AuthShell";
import { SignupForm } from "./SignupForm";

export function SignupScreen() {
  return (
    <AuthShell
      mode="signup"
      title="Create account"
      subtitle="Start your secure Octalve Workspace access."
    >
      <SignupForm />
    </AuthShell>
  );
}
