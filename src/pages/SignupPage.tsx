import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Language } from "@/types";
import TextField from "@/components/common/TextField";
import LanguageSelect from "@/components/common/LanguageSelect";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !contact.trim() || !password.trim()) {
      setError("Please fill in your name, contact, and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signup({ name, contact, password, preferredLanguage });
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
          <h1 className="mb-5 text-2xl font-bold text-ink">Create your account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              id="name"
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
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
              placeholder="Choose a password"
              autoComplete="new-password"
            />
            <LanguageSelect value={preferredLanguage} onChange={setPreferredLanguage} />
            {error && <p className="text-base text-clay-500">{error}</p>}
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-base text-ink/70">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-workshop-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
