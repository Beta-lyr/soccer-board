"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }
    setLoading(true);
    setError("");

    const result = await login(password.trim());

    if (result.success) {
      // 使用 window.location.href 做全页面跳转，确保 cookie 被正确发送
      // router.replace() 在某些场景下（如 middleware 302 后）可能不触发完整导航
      const safeReturnTo = decodeURIComponent(returnTo);
      const target = safeReturnTo.startsWith("/") ? safeReturnTo : "/dashboard/";
      window.location.href = target;
    } else {
      setError(result.error || t("login.error"));
      setLoading(false);
    }
  };

  return (
    <>
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 shadow-lg shadow-primary/20 mb-4 text-2xl">
          ⚽
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          SOCCER<span className="text-primary"> BOARD</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">{t("login.desc")}</p>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder={t("login.placeholder")}
            className="h-11 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/25"
        >
          <LogIn className="mr-2 h-4 w-4" />
          {loading ? "..." : t("login.submit")}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080c] px-4">
      {/* 背景光晕 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <Suspense fallback={<div className="text-white/20 text-center">...</div>}>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
