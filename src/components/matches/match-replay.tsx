"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { Match, MatchEvent, Player } from "@/types";

interface MatchReplayProps {
  match: Match;
  players: Player[];
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  goal: { icon: "⚽", color: "text-green-600", bgColor: "bg-green-500/15" },
  yellow_card: { icon: "🟨", color: "text-yellow-600", bgColor: "bg-yellow-500/15" },
  red_card: { icon: "🟥", color: "text-red-600", bgColor: "bg-red-500/15" },
  substitution: { icon: "🔄", color: "text-blue-600", bgColor: "bg-blue-500/15" },
};

export function MatchReplay({ match, players }: MatchReplayProps) {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [speed, setSpeed] = useState(1000); // ms per event
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const events = [...match.events].sort((a, b) => a.minute - b.minute);
  const currentEvent = currentIndex >= 0 && currentIndex < events.length ? events[currentIndex] : null;
  const progress = events.length > 0 ? ((currentIndex + 1) / events.length) * 100 : 0;

  const getPlayerName = useCallback((pid: string) => {
    return players.find((p) => p.id === pid)?.name ?? "未知球员";
  }, [players]);

  // 播放控制
  useEffect(() => {
    if (isPlaying && currentIndex < events.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, speed);
    } else if (currentIndex >= events.length - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, events.length, speed]);

  const handlePlay = () => {
    if (currentIndex >= events.length - 1) {
      setCurrentIndex(-1);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSpeedChange = () => {
    setSpeed((prev) => prev === 1000 ? 500 : prev === 500 ? 2000 : 1000);
  };

  const speedLabel = speed === 500 ? "2x" : speed === 1000 ? "1x" : "0.5x";

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("matches.replay")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{t("matches.noEventsToReplay")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{t("matches.replay")}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {t("matches.eventCount", { count: events.length })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前事件展示 */}
        <div className="min-h-[120px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentEvent ? (
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">
                  {EVENT_CONFIG[currentEvent.type]?.icon ?? "📝"}
                </div>
                <div className="text-lg font-bold mb-1">
                  {getPlayerName(currentEvent.playerId)}
                </div>
                {currentEvent.relatedPlayerId && (
                  <div className="text-sm text-muted-foreground">
                    {currentEvent.type === "goal"
                      ? `助攻: ${getPlayerName(currentEvent.relatedPlayerId)}`
                      : `← ${getPlayerName(currentEvent.relatedPlayerId)}`}
                  </div>
                )}
                {currentEvent.note && (
                  <div className="text-xs text-muted-foreground mt-1">{currentEvent.note}</div>
                )}
                <Badge
                  variant="outline"
                  className={`mt-2 ${EVENT_CONFIG[currentEvent.type]?.bgColor} ${EVENT_CONFIG[currentEvent.type]?.color}`}
                >
                  {currentEvent.minute}&apos;
                </Badge>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground"
              >
                <div className="text-3xl mb-2">⏱️</div>
                <p className="text-sm">{t("matches.pressPlayToStart")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 进度条 */}
        <div className="relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* 事件标记点 */}
          <div className="absolute top-0 left-0 right-0 h-2 flex">
            {events.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 w-1.5 h-1.5 rounded-full -translate-y-0.5"
                style={{
                  left: `${((i + 1) / events.length) * 100}%`,
                  backgroundColor: i <= currentIndex ? "var(--primary)" : "var(--muted-foreground)",
                  opacity: i <= currentIndex ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={currentIndex < 0}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIndex <= 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {isPlaying ? (
            <Button size="sm" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-1" />
              {t("matches.pause")}
            </Button>
          ) : (
            <Button size="sm" onClick={handlePlay}>
              <Play className="h-4 w-4 mr-1" />
              {currentIndex >= events.length - 1 ? t("matches.restart") : t("matches.play")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleNext} disabled={currentIndex >= events.length - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleSpeedChange}>
            <SkipForward className="h-4 w-4 mr-1" />
            {speedLabel}
          </Button>
        </div>

        {/* 事件时间线 */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {events.map((event, i) => {
            const config = EVENT_CONFIG[event.type];
            const isCurrent = i === currentIndex;
            const isPast = i <= currentIndex;
            return (
              <motion.div
                key={event.id}
                className={`flex items-center gap-2 p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isCurrent ? "bg-primary/10 border border-primary/20" : isPast ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                }`}
                onClick={() => { setIsPlaying(false); setCurrentIndex(i); }}
                initial={false}
                animate={isCurrent ? { scale: 1.02 } : { scale: 1 }}
              >
                <span className="w-6 text-center">{config?.icon}</span>
                <span className="w-8 text-muted-foreground font-mono">{event.minute}&apos;</span>
                <span className="flex-1 truncate font-medium">{getPlayerName(event.playerId)}</span>
                {event.relatedPlayerId && (
                  <span className="text-muted-foreground truncate">
                    {event.type === "goal" ? `(${getPlayerName(event.relatedPlayerId)})` : ""}
                  </span>
                )}
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
