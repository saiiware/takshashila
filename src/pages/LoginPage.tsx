import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TextField from "@/components/common/TextField";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!contact.trim() || !password.trim()) {
      setError("Please enter your email or mobile number and your password.");
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ contact, password });
      navigate("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-extrabold text-workshop-500">Takshashila</p>
          <p className="text-lg text-ink/60">Learn a skill, at your own pace</p>
        </div>

        <Card>
          <h1 className="mb-5 text-2xl font-bold text-ink">Log in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              id="contact"
              label="Email or mobile number"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {error && <p className="text-base text-clay-500">{error}</p>}
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-base text-ink/70">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-workshop-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
