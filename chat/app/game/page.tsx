"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function GameLanding() {
  const router = useRouter();
  const terminalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const enterBtnRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const syncRollRef = useRef<HTMLDivElement>(null);
  const jitterRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const vhsWarpRef = useRef<HTMLDivElement>(null);
  
  const [glitchLocked, setGlitchLocked] = useState(false);
  const glitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isCancelled = false;
    
    // Clear the terminal to handle React 18 Strict Mode double-mounts smoothly
    if (terminalRef.current) {
      terminalRef.current.innerHTML = "";
      terminalRef.current.style.opacity = "1";
    }
    
    const lines = ["INITIALIZING...", "SIGNAL LOCKED", "LEFT AT ALBUQUERQUE"];
    
    const typeLine = (text: string, cb: () => void) => {
      let j = 0;
      const id = setInterval(() => {
        if (isCancelled) {
          clearInterval(id);
          return;
        }
        if (terminalRef.current) {
          terminalRef.current.innerHTML += text[j++];
        }
        if (j >= text.length) {
          clearInterval(id);
          if (terminalRef.current) terminalRef.current.innerHTML += "<br>";
          setTimeout(() => { if (!isCancelled) cb(); }, 150); // Faster typing pace
        }
      }, 20); // Faster letter speed
    };

    const runSequence = (idx: number) => {
      if (idx < lines.length) {
        typeLine(lines[idx], () => runSequence(idx + 1));
      } else {
        setTimeout(showMain, 200);
      }
    };

    const showMain = () => {
      if (isCancelled) return;
      if (terminalRef.current) terminalRef.current.style.opacity = "0";
      if (imageRef.current) {
        imageRef.current.classList.add("visible");
        setTimeout(() => {
          if (isCancelled) return;
          imageRef.current?.classList.add("idle");
          if (enterBtnRef.current) {
             enterBtnRef.current.style.pointerEvents = "auto";
             enterBtnRef.current.classList.add("visible");
          }
        }, 800);
      }
    };

    const seqTimer = setTimeout(() => { if (!isCancelled) runSequence(0); }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(seqTimer);
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    };
  }, []); // Run once on mount

  useEffect(() => {
    const doGlitch = () => {
      if (glitchLocked) return;
      setGlitchLocked(true);

      const type = Math.floor(Math.random() * 5);
      const dur = Math.random() * 150 + 50;

      if (type === 0 && jitterRef.current) {
        const tx = (Math.random() * 8 - 4).toFixed(1);
        const ty = (Math.random() * 4 - 2).toFixed(1);
        jitterRef.current.style.transform = `translate3d(${tx}px,${ty}px,0)`;
        setTimeout(() => { if (jitterRef.current) jitterRef.current.style.transform = "translate3d(0,0,0)"; }, dur);
      } else if (type === 1 && imageRef.current) {
        const tx = (Math.random() * 6 - 3).toFixed(1);
        const sk = (Math.random() * 2 - 1).toFixed(1);
        imageRef.current.classList.remove("idle");
        imageRef.current.style.transform = `translate3d(${tx}px,0,0) skewX(${sk}deg)`;
        imageRef.current.style.opacity = "0.8";
        setTimeout(() => {
          if (imageRef.current) {
            imageRef.current.style.transform = "";
            imageRef.current.style.opacity = "1";
            imageRef.current.classList.add("idle");
          }
        }, dur);
      } else if (type === 2 && vhsWarpRef.current) {
        const sk = (Math.random() * 2.5 - 1.25).toFixed(1);
        const ty = (Math.random() * 3.5 - 1.75).toFixed(1);
        vhsWarpRef.current.style.opacity = "1";
        vhsWarpRef.current.style.transform = `skewX(${sk}deg) translateY(${ty}px)`;
        setTimeout(() => {
          if (vhsWarpRef.current) {
            vhsWarpRef.current.style.opacity = "0";
            vhsWarpRef.current.style.transform = "";
          }
        }, 200);
      } else if (type === 3 && syncRollRef.current) {
        syncRollRef.current.style.opacity = "1";
        const anim = syncRollRef.current.animate(
          [{ transform: "translate3d(0,-100%,0)" }, { transform: "translate3d(0,110%,0)" }],
          { duration: 320, easing: "linear" }
        );
        anim.onfinish = () => { if (syncRollRef.current) syncRollRef.current.style.opacity = "0"; };
      } else if (type === 4 && ghostRef.current) {
        ghostRef.current.style.opacity = "0.2";
        setTimeout(() => { if (ghostRef.current) ghostRef.current.style.opacity = "0"; }, 100);
      }

      if (Math.random() > 0.85 && flashRef.current) {
        flashRef.current.style.opacity = "0.4";
        setTimeout(() => { if (flashRef.current) flashRef.current.style.opacity = "0"; }, 60);
      }

      setTimeout(() => setGlitchLocked(false), dur + 50);
      glitchTimeoutRef.current = setTimeout(doGlitch, Math.random() * 3800 + 1200);
    };

    glitchTimeoutRef.current = setTimeout(doGlitch, 2800);

    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    };
  }, [glitchLocked]);

  const enterSite = () => {
    if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    if (flashRef.current) {
      flashRef.current.style.transition = "opacity 0.6s";
      flashRef.current.style.opacity = "1";
    }
    setTimeout(() => { router.push("/game/play"); }, 650);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") enterSite();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .game-root {
          background: #020100; height: 100vh; width: 100vw; overflow: hidden;
          font-family: "Courier New", Courier, monospace; color: #ffb347;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }
        .crt {
          position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%);
          border-radius: 50% / 10%; overflow: hidden; will-change: opacity;
        }
        .crt::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 5;
          background: repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px);
        }
        
        .screen { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; width: 100%; height: 100%; }
        
        .screen img {
          max-width: 80vw; max-height: 50vh; object-fit: contain;
          opacity: 0; transform: translate3d(0,0,0) scale(0.98); 
          transition: opacity 1s, transform 1s;
          will-change: transform, opacity;
        }
        .screen img.visible { opacity: 1; transform: translate3d(0,0,0) scale(1); }
        .screen img.idle { animation: idleWarp 6s ease-in-out infinite; }
        @keyframes idleWarp {
          0%, 100% { transform: translate3d(0,0,0) scale(1.000, 1.000); }
          50% { transform: translate3d(0,0,0) scale(1.01, 0.99); }
        }
        
        .terminal { position: absolute; top: 15%; width: 100%; text-align: center; letter-spacing: 2px; z-index: 12; font-size: 1.2rem; }
        
        /* Render button securely OUTSIDE of conflicting stacking contexts */
        .enter-wrapper {
          position: fixed; bottom: 8vh; left: 0; width: 100vw; text-align: center; z-index: 999999; 
        }
        .enter { 
          display: inline-block; opacity: 0; cursor: pointer; transition: opacity 0.3s; 
          padding: 12px 30px; font-size: 1.8rem; border: 2px solid transparent; 
          font-weight: bold; background: rgba(0,0,0,0.8); color: #ffb347;
          pointer-events: none; 
        }
        .enter.visible { 
          opacity: 1 !important; 
          animation: blinkFocus 1.5s step-start infinite; 
          border: 2px solid #ffb347; 
          box-shadow: 0 0 15px rgba(255, 179, 71, 0.7), inset 0 0 15px rgba(255, 179, 71, 0.3); 
          background: rgba(200, 100, 0, 0.15); 
          text-shadow: 0 0 10px #ffb347;
        }
        .enter.visible:hover { background: rgba(255, 179, 71, 0.3); }
        @keyframes blinkFocus { 50% { opacity: 0.6; } }
        
        .glitch-bars { position: absolute; inset: 0; pointer-events: none; z-index: 15; }
        .glitch-bars::before, .glitch-bars::after { content: ""; position: absolute; width: 100%; height: 8px; background: rgba(255,180,70,0.4); will-change: transform; opacity: 0.5; }
        .glitch-bars::before { animation: glitch1 5s infinite linear; }
        .glitch-bars::after { animation: glitch2 7s infinite linear; }
        @keyframes glitch1 { 0% { transform: translate3d(0, 5vh, 0); } 100% { transform: translate3d(0, 105vh, 0); } }
        @keyframes glitch2 { 0% { transform: translate3d(0, 90vh, 0); } 100% { transform: translate3d(0, -10vh, 0); } }
        
        .sync-roll { position: absolute; inset: 0; opacity: 0; pointer-events: none; will-change: transform, opacity; z-index: 9; background: linear-gradient(to bottom, transparent, rgba(255,180,70,0.1), transparent); }
        .ghost { position: absolute; inset: 0; background: url("/left.png") center/contain no-repeat; opacity: 0; filter: blur(3px) brightness(1.2); pointer-events: none; will-change: opacity; z-index: 2; transform: translate3d(5px, -5px, 0); }
        .flash { position: absolute; inset: 0; background: rgba(255, 178, 60, 0.8); opacity: 0; pointer-events: none; will-change: opacity; z-index: 20; }
        
        .jitter { position: absolute; inset: 0; pointer-events: none; will-change: transform; z-index: 19; }
        .vhs-warp { position: absolute; inset: 0; opacity: 0; pointer-events: none; will-change: transform, opacity; background: rgba(255,180,70,0.03); z-index: 8; }
        .overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9)); pointer-events: none; z-index: 11; }
      `}} />
      <div className="game-root">
        <div className="crt" id="crt">
          <div className="screen">
            <div className="terminal" id="terminal" ref={terminalRef}></div>
            <img src="/left.png" id="mainImage" ref={imageRef} alt="Left at Albuquerque" />
            <div className="ghost" id="ghost" ref={ghostRef}></div>
          </div>
          
          <div className="glitch-bars"></div>
          <div className="sync-roll" id="syncRoll" ref={syncRollRef}></div>
          <div className="vhs-warp" id="vhsWarp" ref={vhsWarpRef}></div>
          <div className="jitter" id="jitter" ref={jitterRef}></div>
          <div className="flash" id="flash" ref={flashRef}></div>
          <div className="overlay"></div>
        </div>

        {/* MOVED OUTSIDE OF ALL FOREGROUND EFFECTS AND CRT OVERLAYS */}
        <div className="enter-wrapper">
          <div className="enter" id="enterBtn" ref={enterBtnRef} onClick={enterSite}>
            &gt; ENTER _
          </div>
        </div>
      </div>
    </>
  );
}
