import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Session } from "@supabase/supabase-js";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — DoseLoop" }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Auth,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.7 3-4.3 3-7.3 0-.7-.1-1.4-.2-2.1H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-1 6.7-2.5l-3.2-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.7A10 10 0 0 0 12 22z"
      />
      <path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.2V7.7H2.9a10 10 0 0 0 0 8.9l3.3-2.6z" />
      <path
        fill="#4285F4"
        d="M12 6.5c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 2.9 7.7l3.3 2.7C7 8 9.3 6.5 12 6.5z"
      />
    </svg>
  );
}

function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Session synchronization with backend is handled globally by AuthProvider.

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      let data, error;
      if (isSignUp) {
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              firstName,
              lastName,
            },
          },
        }));
      } else {
        ({ data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
      }

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        // Sync is now automatically handled by AuthProvider's onAuthStateChange
        navigate({ to: "/dashboard" });
      } else if (isSignUp) {
        setErrorMsg("Please check your email to confirm registration.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex">
            <Logo />
          </Link>
          <h1 className="text-3xl font-semibold text-foreground">
            {isSignUp ? "Create your loop" : "Welcome back"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignUp
              ? "Sign up to start organizing your family's health."
              : "Sign in to pick up where your family left off."}
          </p>

          <Button
            onClick={signInWithGoogle}
            variant="outline"
            size="lg"
            className="mt-8 w-full justify-center"
            disabled={isLoading}
          >
            <GoogleMark />
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          {errorMsg && (
            <div className="mb-4 rounded bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleAuth}>
            {isSignUp && (
              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jane"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@family.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Encrypted in transit & at rest
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "New to DoseLoop? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Create your loop"}
            </button>
          </p>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-primary/8 p-12 lg:flex">
        <div className="max-w-md space-y-6">
          <Logo size="lg" />
          <blockquote className="text-2xl font-display font-medium leading-snug text-foreground">
            "I stopped ending every call with 'did you take your medicine?' — DoseLoop quietly tells
            me Dad's okay."
          </blockquote>
          <p className="text-muted-foreground">Ananya, long-distance caregiver</p>
        </div>
        <Link
          to="/"
          className="absolute left-8 top-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
