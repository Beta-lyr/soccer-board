"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Swords, Trophy, Calendar, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

function Football3D() {
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ballRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      ballRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80" style={{ perspective: "1000px" }}>
      <div
        ref={ballRef}
        className="w-full h-full rounded-full relative transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a15 100%)
          `,
          boxShadow: `
            0 0 80px rgba(99, 102, 241, 0.3),
            0 0 160px rgba(99, 102, 241, 0.15),
            inset 0 -20px 60px rgba(0,0,0,0.5),
            inset 0 20px 40px rgba(255,255,255,0.05)
          `,
        }}
      >
        {/* 五边形纹理 */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 200">
          <polygon points="100,20 130,55 120,95 80,95 70,55" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="130,55 165,75 155,115 120,95" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="70,55 35,75 45,115 80,95" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="80,95 120,95 130,135 100,155 70,135" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="120,95 155,115 150,155 130,135" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="45,115 80,95 70,135 50,155" fill="none" stroke="white" strokeWidth="1" />
        </svg>
        {/* 高光 */}
        <div
          className="absolute top-4 left-8 w-20 h-12 rounded-full opacity-30"
          style={{
            background: "radial-gradient(ellipse, white 0%, transparent 70%)",
            transform: "rotate(-30deg)",
          }}
        />
      </div>
    </div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 网格线 */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      {/* 渐变光晕 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
    </div>
  );
}

export default function LandingPage() {
  const FEATURES = [
    { icon: Swords, label: "战术板", desc: "可视化阵型与球员路线绘制", accent: "from-violet-500 to-indigo-500" },
    { icon: Users, label: "球员管理", desc: "档案、能力雷达图、头像管理", accent: "from-blue-500 to-cyan-500" },
    { icon: Trophy, label: "比赛记录", desc: "实时计时、事件记录、赛后评分", accent: "from-amber-500 to-orange-500" },
    { icon: Calendar, label: "训练日程", desc: "出勤跟踪、主题分类统计", accent: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-[#08080c] text-white overflow-hidden relative">
      <GridBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20">
            ⚽
          </div>
          <span className="text-lg font-bold tracking-tight">
            SOCCER<span className="text-primary"> BOARD</span>
          </span>
        </div>
        <Link href="/dashboard/">
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
            进入系统
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
        <div className="mb-10">
          <Football3D />
        </div>

        <div className="space-y-4 max-w-2xl">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary/80 font-medium">
            University Football Team Management
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            <span className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              掌控
            </span>
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-primary bg-clip-text text-transparent">
              比赛
            </span>
          </h1>
          <p className="text-base md:text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
            战术画板 · 球员档案 · 实时记录 · 训练管理
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/">
            <Button size="lg" className="text-base px-8 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/25">
              进入系统 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white/80">
            <Play className="mr-2 h-4 w-4" /> 了解更多
          </Button>
        </div>

        {/* 向下箭头 */}
        <div className="absolute bottom-8 animate-bounce">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-500"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">{f.label}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                {/* 边角装饰 */}
                <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b ${f.accent} opacity-50`} />
                  <div className={`absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l ${f.accent} opacity-50`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-white/[0.04]">
        <p className="text-xs text-white/20">
          Soccer Board © {new Date().getFullYear()} · 河北农业大学足球队
        </p>
      </footer>
    </div>
  );
}
