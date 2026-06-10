"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Swords, Trophy, Calendar } from "lucide-react";
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
        {/* 足球缝线纹理 — 截角二十面体（12五边形+20六边形）球面投影，scale=98 填满球面 */}
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 200 200">
          {/* 缝线（贝塞尔曲线模拟球面弯曲，z-depth 透明度渐变） */}
          <path d="M132.8,119.8 Q127.9,100.0 132.8,80.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M132.8,119.8 Q113.4,125.3 98.6,139.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M132.8,119.8 Q141.7,127.0 158.7,139.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M118.6,196.0 Q100.0,191.1 81.4,196.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.35" strokeLinecap="round" />
          <path d="M118.6,196.0 Q131.6,185.3 148.1,183.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.37" strokeLinecap="round" />
          <path d="M197.0,100.0 Q189.8,84.8 192.2,68.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.34" strokeLinecap="round" />
          <path d="M197.0,100.0 Q189.8,115.2 192.2,132.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.34" strokeLinecap="round" />
          <path d="M132.8,80.2 Q113.4,74.7 98.6,60.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M132.8,80.2 Q141.7,73.0 158.7,60.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M81.4,196.0 Q68.4,185.3 51.9,183.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.33" strokeLinecap="round" />
          <path d="M81.4,196.0 Q78.8,185.1 73.8,183.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.44" strokeLinecap="round" />
          <path d="M118.6,4.0 Q100.0,8.9 81.4,4.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.35" strokeLinecap="round" />
          <path d="M118.6,4.0 Q131.6,14.7 148.1,16.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.37" strokeLinecap="round" />
          <path d="M16.6,100.0 Q14.7,100.0 3.0,100.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.47" strokeLinecap="round" />
          <path d="M16.6,100.0 Q30.5,85.0 34.8,68.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.56" strokeLinecap="round" />
          <path d="M16.6,100.0 Q30.5,115.0 34.8,132.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.56" strokeLinecap="round" />
          <path d="M81.4,4.0 Q68.4,14.7 51.9,16.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.33" strokeLinecap="round" />
          <path d="M81.4,4.0 Q78.8,14.9 73.8,16.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.44" strokeLinecap="round" />
          <path d="M3.0,100.0 Q10.2,84.8 7.8,68.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.36" strokeLinecap="round" />
          <path d="M3.0,100.0 Q10.2,115.2 7.8,132.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.36" strokeLinecap="round" />
          <path d="M51.9,16.2 Q42.1,29.9 26.0,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.33" strokeLinecap="round" />
          <path d="M7.8,68.0 Q21.1,54.5 26.0,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.35" strokeLinecap="round" />
          <path d="M73.8,16.2 Q89.3,27.2 103.3,28.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.55" strokeLinecap="round" />
          <path d="M73.8,16.2 Q59.1,30.3 39.5,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.50" strokeLinecap="round" />
          <path d="M7.8,132.0 Q21.1,145.5 26.0,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.35" strokeLinecap="round" />
          <path d="M51.9,183.8 Q42.1,170.1 26.0,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.33" strokeLinecap="round" />
          <path d="M98.6,60.5 Q100.9,49.4 103.3,28.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M98.6,60.5 Q84.1,74.5 64.3,80.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M73.8,183.8 Q89.3,172.8 103.3,171.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.55" strokeLinecap="round" />
          <path d="M73.8,183.8 Q59.1,169.7 39.5,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.50" strokeLinecap="round" />
          <path d="M158.7,60.5 Q167.1,72.2 184.6,80.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.55" strokeLinecap="round" />
          <path d="M158.7,60.5 Q146.3,48.1 140.5,28.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.57" strokeLinecap="round" />
          <path d="M34.8,68.0 Q53.9,76.4 64.3,80.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M34.8,68.0 Q41.1,55.0 39.5,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.54" strokeLinecap="round" />
          <path d="M148.1,16.2 Q141.9,26.6 140.5,28.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.47" strokeLinecap="round" />
          <path d="M148.1,16.2 Q157.9,29.9 174.0,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.37" strokeLinecap="round" />
          <path d="M34.8,132.0 Q41.1,145.0 39.5,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.54" strokeLinecap="round" />
          <path d="M34.8,132.0 Q53.9,123.6 64.3,119.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M192.2,68.0 Q183.7,75.5 184.6,80.2" fill="none" stroke="white" strokeWidth="0.45" opacity="0.45" strokeLinecap="round" />
          <path d="M192.2,68.0 Q178.9,54.5 174.0,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.35" strokeLinecap="round" />
          <path d="M98.6,139.5 Q100.9,150.6 103.3,171.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M98.6,139.5 Q84.1,125.5 64.3,119.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M148.1,183.8 Q141.9,173.4 140.5,171.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.47" strokeLinecap="round" />
          <path d="M148.1,183.8 Q157.9,170.1 174.0,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.37" strokeLinecap="round" />
          <path d="M192.2,132.0 Q178.9,145.5 174.0,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.35" strokeLinecap="round" />
          <path d="M192.2,132.0 Q183.7,124.5 184.6,119.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.45" strokeLinecap="round" />
          <path d="M158.7,139.5 Q146.3,151.9 140.5,171.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.57" strokeLinecap="round" />
          <path d="M158.7,139.5 Q167.1,127.8 184.6,119.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.55" strokeLinecap="round" />
          <path d="M26.0,36.0 Q36.3,39.4 39.5,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.44" strokeLinecap="round" />
          <path d="M103.3,28.5 Q120.5,33.1 140.5,28.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.56" strokeLinecap="round" />
          <path d="M26.0,164.0 Q36.3,160.6 39.5,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.44" strokeLinecap="round" />
          <path d="M160.5,36.0 Q163.7,39.4 174.0,36.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.26" strokeLinecap="round" />
          <path d="M64.3,80.2 Q69.2,100.0 64.3,119.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.60" strokeLinecap="round" />
          <path d="M103.3,171.5 Q120.5,166.9 140.5,171.5" fill="none" stroke="white" strokeWidth="0.45" opacity="0.56" strokeLinecap="round" />
          <path d="M160.5,164.0 Q163.7,160.6 174.0,164.0" fill="none" stroke="white" strokeWidth="0.45" opacity="0.26" strokeLinecap="round" />
          <path d="M184.6,80.2 Q179.7,100.0 184.6,119.8" fill="none" stroke="white" strokeWidth="0.45" opacity="0.51" strokeLinecap="round" />
          {/* 五边形面（深度排序，背面到前面） */}
          <polygon points="7.8,68.0 3.0,100.0 7.8,132.0 15.4,119.8 15.4,80.2" fill="rgba(255,255,255,0.020)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="118.6,4.0 126.2,16.2 160.5,36.0 174.0,36.0 148.1,16.2" fill="rgba(255,255,255,0.020)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="160.5,164.0 126.2,183.8 118.6,196.0 148.1,183.8 174.0,164.0" fill="rgba(255,255,255,0.020)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="39.5,164.0 73.8,183.8 81.4,196.0 51.9,183.8 26.0,164.0" fill="rgba(255,255,255,0.040)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="81.4,4.0 73.8,16.2 39.5,36.0 26.0,36.0 51.9,16.2" fill="rgba(255,255,255,0.040)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="192.2,68.0 197.0,100.0 192.2,132.0 184.6,119.8 184.6,80.2" fill="rgba(255,255,255,0.041)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          {/* 六边形面 */}
          <polygon points="39.5,36.0 34.8,68.0 16.6,100.0 3.0,100.0 7.8,68.0 26.0,36.0" fill="rgba(255,255,255,0.048)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="16.6,100.0 34.8,132.0 39.5,164.0 26.0,164.0 7.8,132.0 3.0,100.0" fill="rgba(255,255,255,0.048)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="81.4,4.0 118.6,4.0 148.1,16.2 140.5,28.5 103.3,28.5 73.8,16.2" fill="rgba(255,255,255,0.048)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="73.8,183.8 103.3,171.5 140.5,171.5 148.1,183.8 118.6,196.0 81.4,196.0" fill="rgba(255,255,255,0.048)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="148.1,16.2 174.0,36.0 192.2,68.0 184.6,80.2 158.7,60.5 140.5,28.5" fill="rgba(255,255,255,0.049)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="192.2,132.0 174.0,164.0 148.1,183.8 140.5,171.5 158.7,139.5 184.6,119.8" fill="rgba(255,255,255,0.049)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="103.3,28.5 98.6,60.5 64.3,80.2 34.8,68.0 39.5,36.0 73.8,16.2" fill="rgba(255,255,255,0.071)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="64.3,119.8 98.6,139.5 103.3,171.5 73.8,183.8 39.5,164.0 34.8,132.0" fill="rgba(255,255,255,0.071)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="184.6,80.2 184.6,119.8 158.7,139.5 132.8,119.8 132.8,80.2 158.7,60.5" fill="rgba(255,255,255,0.071)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          {/* 中心五边形 */}
          <polygon points="64.3,80.2 64.3,119.8 34.8,132.0 16.6,100.0 34.8,68.0" fill="rgba(255,255,255,0.074)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          {/* 正面六边形 */}
          <polygon points="140.5,28.5 158.7,60.5 132.8,80.2 98.6,60.5 103.3,28.5" fill="rgba(255,255,255,0.075)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="132.8,119.8 158.7,139.5 140.5,171.5 103.3,171.5 98.6,139.5" fill="rgba(255,255,255,0.075)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
          <polygon points="132.8,80.2 132.8,119.8 98.6,139.5 64.3,119.8 64.3,80.2 98.6,60.5" fill="rgba(255,255,255,0.080)" stroke="white" strokeWidth="0.65" strokeLinejoin="round" />
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
        <a
          href="https://github.com/Beta-lyr/soccer-board"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
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

        <div className="mt-10">
          <Link href="/dashboard/">
            <Button size="lg" className="text-base px-8 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/25">
              进入系统 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
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
