"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

const signupSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    setSuccess(null);

    const { error, data: signUpData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username: data.username,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else if (signUpData.user && signUpData.session) {
      // User was auto-confirmed (email confirmation disabled in Supabase)
      router.push("/chat");
      router.refresh();
    } else {
      setSuccess("Check your email for a confirmation link! (Check spam folder too)");
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Radial gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 20%, rgba(236,72,153,0.16) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(147,51,234,0.14) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Glass card */}
        <div
          className="rounded-3xl p-8 space-y-7 sc-glass"
          style={{ boxShadow: "0 0 60px rgba(236,72,153,0.08), 0 30px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-14 h-14 rounded-2xl sc-gradient-bg items-center justify-center mx-auto">
              <Sparkles size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Create an Account
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--sc-text-muted)" }}>
                Join SmartChat today
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Username
              </Label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--sc-text-muted)" }}
                />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  {...register("username")}
                  className="pl-10 h-11 rounded-xl text-sm border transition-all duration-200
                    focus:ring-2 focus:ring-[var(--sc-purple)] focus:ring-offset-0"
                  style={{
                    background: "var(--input)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--sc-text-muted)" }}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="pl-10 h-11 rounded-xl text-sm border transition-all duration-200
                    focus:ring-2 focus:ring-[var(--sc-purple)] focus:ring-offset-0"
                  style={{
                    background: "var(--input)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Password
              </Label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--sc-text-muted)" }}
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-10 h-11 rounded-xl text-sm border transition-all duration-200
                    focus:ring-2 focus:ring-[var(--sc-purple)] focus:ring-offset-0"
                  style={{
                    background: "var(--input)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <AlertCircle size={13} /> {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-400 flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <CheckCircle size={13} /> {success}
              </motion.div>
            )}

            <Button
              id="signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-semibold text-sm sc-gradient-bg text-white border-0
                hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--sc-text-muted)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--sc-purple)" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
