'use client';

import { useState, useEffect } from 'react';
import { Monitor, Mouse, ChevronRight } from 'lucide-react';

interface AttractScreenProps {
    onStart: () => void;
}

export default function AttractScreen({ onStart }: AttractScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleStart = () => {
        setIsVisible(false);
        setTimeout(onStart, 500); // Allow exit animation to finish
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={handleStart}
            className={`fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80" />

            {/* Animated Grid Background (Optional CSS trick) */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(#E02127 1px, transparent 1px), linear-gradient(90deg, #E02127 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
                    animation: 'grid-move 20s linear infinite'
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center space-y-12 animate-in fade-in zoom-in duration-1000">

                {/* Logo / Brand Area */}
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-6 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 shadow-[0_0_50px_rgba(224,33,39,0.3)] mb-6 animate-float">
                        <Monitor className="w-24 h-24 text-[#E02127]" />
                    </div>
                    <img
                        src="https://wckxhidltmnvpbrswnmz.supabase.co/storage/v1/object/public/componentes/branding/microhouse-logo.png?v=2"
                        alt="MicroHouse"
                        className="h-24 md:h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(224,33,39,0.5)] mx-auto"
                    />
                    <p className="text-xl md:text-2xl text-slate-400 font-light tracking-widest uppercase">
                        Tu próxima PC Gamer empieza acá
                    </p>
                </div>

                {/* Call to Action */}
                <div className="space-y-4">
                    <button
                        className="group relative px-12 py-6 bg-[#E02127] hover:bg-[#b91c21] text-white text-2xl font-bold rounded-full shadow-[0_0_30px_rgba(224,33,39,0.5)] hover:shadow-[0_0_50px_rgba(224,33,39,0.8)] transition-all duration-300 transform hover:scale-105"
                    >
                        <span className="flex items-center gap-4">
                            TOCÁ PARA COMENZAR
                            <ChevronRight className="w-8 h-8 animate-pulse" />
                        </span>

                        {/* Ripple Effect Ring */}
                        <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping opacity-75"></span>
                    </button>
                </div>

            </div>

            {/* Footer / Decor */}
            <div className="absolute bottom-12 text-slate-500 text-sm font-medium tracking-widest animate-pulse">
                ARMADO DE PC • HARDWARE • GAMING
            </div>

            <style jsx>{`
        @keyframes grid-move {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px) translateZ(-200px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
        </div>
    );
}
