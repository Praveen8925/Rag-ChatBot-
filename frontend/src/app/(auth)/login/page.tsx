"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      setError(error.message);
    } else {
      router.push("/chat");
      router.refresh(); // to trigger middleware and layout refresh
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
            "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(147,51,234,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(236,72,153,0.14) 0%, transparent 60%)",
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
          style={{ boxShadow: "0 0 60px rgba(147,51,234,0.1), 0 30px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-14 h-14 rounded-2xl sc-gradient-bg items-center justify-center mx-auto">
              <Sparkles size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Welcome back
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--sc-text-muted)" }}>
                Sign in to SmartChat
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <Button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-semibold text-sm sc-gradient-bg text-white border-0
                hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--sc-text-muted)" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--sc-purple)" }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
