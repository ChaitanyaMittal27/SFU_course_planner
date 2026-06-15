"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { displayStyles } from "@/app/fonts";

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [floatingBooks, setFloatingBooks] = useState<number[]>([]);

  useEffect(() => {
    setFloatingBooks(Array.from({ length: 6 }, (_, i) => i));
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 800),
      setTimeout(() => setStage(3), 1500),
      setTimeout(() => setStage(4), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage >= 3) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 3;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 4) setTimeout(onComplete, 500);
  }, [stage, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        stage === 4 ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)" }}
    >
      {/* Floating graduation caps */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingBooks.map((i) => (
          <div
            key={i}
            className="absolute animate-float text-white/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 2)}s`,
            }}
          >
            <GraduationCap size={40} />
          </div>
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ top: "10%", left: "20%" }}
        />
        <div
          className="absolute w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ bottom: "15%", right: "25%", animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl px-6">
        {/* Logo circle */}
        {stage >= 1 && (
          <div className="mb-8 animate-scale-in">
            <div className="relative w-28 h-28 mx-auto">
              <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border-4 border-white/20 rounded-full animate-spin-reverse" />
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full shadow-2xl">
                <GraduationCap className="w-16 h-16" style={{ color: "var(--primary)" }} />
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        {stage >= 2 && (
          <div className="mb-6">
            <h1 className={`${displayStyles.hero} text-white mb-3 animate-fade-in`}>
              SFU Course Planner
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-white to-transparent animate-width-expand" />
          </div>
        )}

        {/* Subtitle */}
        {stage >= 2 && (
          <p className="text-xl text-white/90 mb-12 animate-fade-in-delay font-light tracking-wide">
            Plan Your Academic Journey
          </p>
        )}

        {/* Progress section */}
        {stage >= 3 && (
          <div className="animate-slide-up">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="relative h-3 bg-black/20 rounded-full overflow-hidden mb-4">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/60 via-white to-white/60 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-white/80">
                  {progress < 30 && "Loading courses..."}
                  {progress >= 30 && progress < 60 && "Preparing interface..."}
                  {progress >= 60 && progress < 100 && "Almost ready..."}
                  {progress === 100 && "✓ Ready!"}
                </span>
                <span className="font-bold text-white">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div className="animate-fade-in-stagger-1">
                <div className="font-bold text-white">500+</div>
                <div className="text-white/70">Courses</div>
              </div>
              <div className="animate-fade-in-stagger-2">
                <div className="font-bold text-white">50+</div>
                <div className="text-white/70">Departments</div>
              </div>
              <div className="animate-fade-in-stagger-3">
                <div className="font-bold text-white">3</div>
                <div className="text-white/70">Campuses</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
