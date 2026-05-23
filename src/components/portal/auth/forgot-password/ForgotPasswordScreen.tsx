import { AuthShell } from "../components/AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordScreen() {
  return (
    <AuthShell
      mode="forgot"
      title="Reset password"
      subtitle="Enter your email to receive a secure reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
