"use client";

import { useState, useEffect, useRef } from "react";
import { GameChoice, PlayerPassport, GhostPost, createInitialGameState } from "@/lib/game/gameState";
import OpeningSequence, { ACTS } from "./OpeningSequence";

const WAYPOINTS = [
  { name: "L.A.", pct: 0 },
  { name: "LAS VEGAS", pct: 9.3 },
  { name: "ALBUQUERQUE", pct: 23.6 },
  { name: "AMARILLO", pct: 36.4 },
  { name: "OKC", pct: 45.7 },
  { name: "ST. LOUIS", pct: 61.8 },
  { name: "INDIANAPOLIS", pct: 71.8 },
  { name: "PITTSBURGH", pct: 86.8 },
  { name: "N.Y.C.", pct: 100 },
];

const LEADERBOARDSEED = [
  { name: "Vinnie_TwoToes", time: "18h 12m", badge: "THE SKEPTIC" },
  { name: "DesertRat_88", time: "22h 45m", badge: "THE GHOST" },
  { name: "Route66_Survivor", time: "28h 33m", badge: "THE ASSOCIATE" },
  { name: "BailBond_Benny", time: "31h 08m", badge: "LUCKY DEVIL" },
  { name: "JerseyMike_99", time: "44h 55m", badge: "CERT. SUCKER" },
];

function getBadge(ds: number, td: number) {
  const total = ds + td;
  if (total === 0) return { title: "THE SKEPTIC", desc: "You boring, literal human. You ignored everything. I respect it. Barely." };
  const rate = td / Math.max(1, total);
  if (rate < 0.25) return { title: "THE SKEPTIC", desc: "Mostly ignored the bait. Mickey would call you 'paranoid.' That's a compliment." };
  if (rate < 0.5) return { title: "THE ASSOCIATE", desc: "Fell for some of it. Mickey would say you have potential. Too bad Mickey doesn't exist." };
  if (rate < 0.75) return { title: "THE MARK", desc: "More than half the lies landed. The other half just weren't shiny enough yet." };
  return { title: "CERTIFIED SUCKER", desc: "I told you at the very start. Literally the first sentence. I WILL DECEIVE YOU. You believed every word anyway." };
}

export default function LeftAtAlbuquerque() {
  const [phase, setPhase] = useState("opening");
  const [gs, setGs] = useState<PlayerPassport>(createInitialGameState("session_" + Math.random().toString(36).substr(2, 9)));
  const [narrative, setNarrative] = useState("");
  const [choices, setChoices] = useState<GameChoice[]>([]);
  const [feed, setFeed] = useState<GhostPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [gameOverReason, setGameOverReason] = useState("");
  const [victoryData, setVictoryData] = useState<{minutes: number, gs: PlayerPassport} | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [blink, setBlink] = useState(true);
  
  // Real Multiplayer Feed State
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [showMission, setShowMission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const twRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/temp/audio.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.04;
      
      const startAudio = () => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
      };
      
      document.addEventListener("click", startAudio, { once: true });
      document.addEventListener("keydown", startAudio, { once: true });
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        document.removeEventListener("click", startAudio);
        document.removeEventListener("keydown", startAudio);
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("leftAtAlbuquerqueState");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phase && parsed.gs && parsed.history) {
          setPhase(parsed.phase);
          setGs(parsed.gs);
          setNarrative(parsed.narrative || "");
          setChoices(parsed.choices || []);
          setHistory(parsed.history);
          setGameOverReason(parsed.gameOverReason || "");
          setVictoryData(parsed.victoryData || null);
          setStartTime(parsed.startTime || Date.now());
        }
      }
    } catch(e) {}
  }, []);

  // Save state
  useEffect(() => {
    if (phase === "opening" || phase === "intro") return;
    localStorage.setItem("leftAtAlbuquerqueState", JSON.stringify({
      phase, gs, narrative, choices, history, gameOverReason, victoryData, startTime
    }));
  }, [phase, gs, narrative, choices, history, gameOverReason, victoryData, startTime]);

  // Global Feed Polling
  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/game/feed");
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setFeed(data.posts);
        }
      }
    } catch (e) {
      console.error("Failed to fetch global feed", e);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Map blink
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 550);
    return () => clearInterval(t);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!narrative) return;
    setDisplayText("");
    let i = 0;
    if (twRef.current) clearInterval(twRef.current);
    twRef.current = setInterval(() => {
      i++;
      setDisplayText(narrative.slice(0, i));
      if (i >= narrative.length && twRef.current) clearInterval(twRef.current);
    }, 16);
    return () => { if(twRef.current) clearInterval(twRef.current); };
  }, [narrative]);

  const progress = (2800 - gs.miles_to_nyc) / 2800;
  const playerX = 5 + Math.max(0, Math.min(1, progress)) * 90;

  const resetGame = () => {
    localStorage.removeItem("leftAtAlbuquerqueState");
    window.location.reload();
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || isBroadcasting) return;

    setIsBroadcasting(true);
    try {
      const playerNameFallback = "anon_" + gs.sessionId?.substring(gs.sessionId.length - 4);
      await fetch("/api/game/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: `@${playerNameFallback}`,
          message: broadcastMessage.trim().substring(0, 120),
          is_ai: false
        })
      });
      setBroadcastMessage("");
      fetchFeed();
    } catch (e) {
      console.error("Broadcast failed", e);
    }
    setIsBroadcasting(false);
  };

  const callAI = async (choice: GameChoice | null = null) => {
    setLoading(true);
    if (phase === "opening" || phase === "intro") setStartTime(Date.now());

    try {
      const res = await fetch("/api/game/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice, gameState: gs, history }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      const parsed = data.parsed;

      setHistory(data.history);
      const newGs = {
        ...gs, 
        ...parsed.game_state_update,
        cash: Number(parsed.game_state_update?.cash ?? gs.cash) || gs.cash,
        heat: Number(parsed.game_state_update?.heat ?? gs.heat) || gs.heat,
        miles_to_nyc: Number(parsed.game_state_update?.miles_to_nyc ?? gs.miles_to_nyc) || gs.miles_to_nyc,
        distraction_score: Number(parsed.game_state_update?.distraction_score ?? gs.distraction_score) || gs.distraction_score,
        times_deceived: Number(parsed.game_state_update?.times_deceived ?? gs.times_deceived) || gs.times_deceived,
        turn: gs.turn + 1,
        choices_history: choice ? [...gs.choices_history, choice.id] : gs.choices_history,
      };
      setGs(newGs);

      // Force instant feed update to show AI's ghost post if generated
      setTimeout(fetchFeed, 800);

      setNarrative(parsed.narrative || "");
      setChoices(parsed.choices || []);

      if (parsed.game_over || parsed.game_state_update?.heat >= 100 || parsed.game_state_update?.cash <= 0) {
        setGameOverReason(parsed.game_over_reason || "The road ends here.");
        setNarrative(parsed.narrative || "");
        setPhase("dead");
      } else if (parsed.victory || parsed.game_state_update?.miles_to_nyc <= 0) {
        setVictoryData({ minutes: Math.floor((Date.now() - startTime) / 60000), gs: newGs });
        setNarrative(parsed.narrative || "");
        setPhase("victory");
      } else {
        setPhase("playing");
      }
    } catch (e) {
      console.error(e);
      setNarrative("[ SYSTEM GLITCH. THE NARRATOR IS EXPERIENCING TECHNICAL DIFFICULTIES. YOUR JOURNEY PAUSES. ]");
      setChoices([{ id: "A", label: "CONTINUE", description: "Press on despite the glitch." }]);
      setPhase("playing");
    }
    setLoading(false);
  };

  const A = "#FFB300", Adim = "#7A5200", Abright = "#FFD060", Afade = "#3D2800", bg = "#060604";
  const font = "'VT323', monospace";
  const base = { fontFamily: font, color: A, background: bg, minHeight: "100vh" };

  const CSSBlock = () => (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { background: #060604; margin: 0; padding: 0; }
      .sl {
        position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        background: repeating-linear-gradient(0deg, rgba(0,0,0,0.09) 0, rgba(0,0,0,0.09) 1px, transparent 1px, transparent 3px);
      }
      .glow { text-shadow: 0 0 12px #FFB300, 0 0 28px #FF8800; }
      .glow-red { text-shadow: 0 0 12px #CC2200, 0 0 28px #991100; }
      .pulse { animation: pp 1.8s ease-in-out infinite; }
      @keyframes pp { 0%,100%{opacity:1} 50%{opacity:.25} }
      .cbtn {
        display: block; width: 100%; text-align: left; background: transparent;
        border: 1px solid #7A5200; color: #FFB300; font-family: 'VT323',monospace;
        font-size: 1.1rem; padding: 0.55rem 0.8rem; cursor: pointer;
        margin-bottom: 0.4rem; line-height: 1.35; transition: all 0.08s;
      }
      .cbtn:hover { background: rgba(255,179,0,0.08); border-color: #FFB300; }
      .ibtn {
        background: transparent; border: 2px solid #FFB300; color: #FFB300;
        font-family: 'VT323',monospace; font-size: 1.7rem; padding: 0.5rem 2.8rem;
        cursor: pointer; letter-spacing: 0.15em; transition: background 0.1s;
      }
      .ibtn:hover { background: rgba(255,179,0,0.1); }
      .input-terminal {
        background: rgba(0,0,0,0.4);
        border: 1px solid #7a5200;
        color: #ffb300;
        font-family: 'VT323', monospace;
        font-size: 1rem;
        padding: 0.4rem;
        width: 100%;
        outline: none;
      }
      .input-terminal:focus { border-color: #ffcf60; box-shadow: 0 0 8px rgba(255, 179, 0, 0.2); }
      .input-terminal::placeholder { color: #3d2800; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #060604; }
      ::-webkit-scrollbar-thumb { background: #7A5200; }
    `}} />
  );

  // ── OPENING ──────────────────────────────────────────────────────────────
  if (phase === "opening" || phase === "intro") return (
    <div style={{ ...base, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <CSSBlock />
      <div className="sl" />
      <OpeningSequence onComplete={() => callAI(null)} />
    </div>
  );

  // ── DEAD ───────────────────────────────────────────────────────────────
  if (phase === "dead") return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <CSSBlock />
      <div className="sl" />
      <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
        <div className="glow-red" style={{ fontSize: "3rem", color: "#CC2200", marginBottom: "1rem" }}>
          ► GAME OVER ◄
        </div>
        <div style={{ color: Adim, fontSize: "1.1rem", marginBottom: "1rem" }}>
          You traveled {2800 - gs.miles_to_nyc} of 2,800 miles.
        </div>
        <div style={{ border: "1px solid #661100", padding: "1.2rem", marginBottom: "0.8rem", fontSize: "1.1rem", lineHeight: 1.7, textAlign: "left", color: A }}>
          {narrative || "The road ends here."}
        </div>
        {gameOverReason && (
          <div style={{ color: "#CC4400", fontSize: "1.1rem", marginBottom: "1.5rem", fontStyle: "italic" }}>
            [ {gameOverReason} ]
          </div>
        )}
        <div style={{ color: Adim, fontSize: "1rem", marginBottom: "2rem" }}>
          I told you. Right at the beginning. First sentence.
        </div>
        <button className="ibtn" onClick={resetGame}>► TRY AGAIN</button>
      </div>
    </div>
  );

  // ── VICTORY ────────────────────────────────────────────────────────────
  if (phase === "victory") {
    const badge = victoryData ? getBadge(victoryData.gs.distraction_score, victoryData.gs.times_deceived) : { title: "?", desc: "?" };
    const mins = victoryData?.minutes || 0;
    const timeStr = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
    return (
      <div style={{ ...base, padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CSSBlock />
        <div className="sl" />
        <div style={{ maxWidth: 680, width: "100%", textAlign: "center" }}>
          <div className="glow" style={{ fontSize: "2.2rem", marginBottom: "0.4rem" }}>► YOU REACHED NEW YORK CITY ◄</div>
          <div style={{ color: Adim, marginBottom: "2rem", fontSize: "1rem" }}>
            Against all odds. Against the narrator. Against your own instincts.
          </div>
          {narrative && (
            <div style={{ border: `1px solid ${Adim}`, padding: "1rem", marginBottom: "1.5rem", textAlign: "left", lineHeight: 1.7, fontSize: "1.05rem" }}>
              {narrative}
            </div>
          )}
          <div style={{ border: `1px solid ${Adim}`, padding: "1.5rem", marginBottom: "1.5rem", textAlign: "left", lineHeight: 2.2, fontSize: "1.15rem" }}>
            <div style={{ color: Abright, textAlign: "center", marginBottom: "1rem", fontSize: "1.4rem", letterSpacing: "0.05em" }}>
              ═══ INVOICE OF DECEPTION ═══
            </div>
            <div>TOTAL PLAY TIME:          <strong style={{ color: Abright }}>{timeStr}</strong></div>
            <div>TOTAL DECISIONS MADE:     <strong style={{ color: Abright }}>{victoryData?.gs.turn}</strong></div>
            <div>DISTRACTIONS PURSUED:     <strong style={{ color: (victoryData?.gs.distraction_score || 0) > 3 ? "#FF8800" : Abright }}>{victoryData?.gs.distraction_score}</strong></div>
            <div>TIMES SUCCESSFULLY LIED TO: <strong style={{ color: (victoryData?.gs.times_deceived || 0) > 5 ? "#CC4400" : Abright }}>{victoryData?.gs.times_deceived}</strong></div>
            <div>CASH REMAINING:           <strong style={{ color: Abright }}>${victoryData?.gs.cash}</strong></div>
            <div>FINAL HEAT LEVEL:         <strong style={{ color: (victoryData?.gs.heat || 0) > 50 ? "#CC4400" : Abright }}>{victoryData?.gs.heat}%</strong></div>
            <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: `1px solid ${Adim}` }}>
              MICKEY&apos;S BILLION DOLLARS:   <strong style={{ color: "#CC4400" }}>NEVER EXISTED</strong>
            </div>
          </div>
          <div style={{ border: `2px solid ${A}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div className="glow" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
              RANK: {badge.title}
            </div>
            <div style={{ color: Adim, fontSize: "1.1rem", fontStyle: "italic" }}>&quot;{badge.desc}&quot;</div>
          </div>
          <div style={{ color: Adim, fontSize: "0.95rem", marginBottom: "2rem" }}>
            — The Narrator
          </div>
          <button className="ibtn" onClick={resetGame}>► PLAY AGAIN</button>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────
  const heatColor = gs.heat >= 80 ? "#CC2200" : gs.heat >= 50 ? "#FF7700" : gs.heat >= 25 ? "#FF9900" : A;

  return (
    <div style={{ ...base, padding: "0.8rem 1rem", WebkitTextSizeAdjust: "100%" }}>
      <CSSBlock />
      <div className="sl" />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${Adim}`, paddingBottom: "0.5rem", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
          <span className="glow" style={{ fontSize: "1.4rem", letterSpacing: "0.04em" }}>
            LEFT AT ALBUQUERQUE
          </span>
          <button 
            onClick={() => setShowMission(true)}
            style={{ 
              background: "transparent", border: `1px solid ${Adim}`, color: Abright, 
              padding: "0.2rem 0.6rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,179,71,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            [ MISSION FILE ]
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            style={{ 
              background: "transparent", border: `1px solid ${Adim}`, color: isMuted ? Adim : Abright, 
              padding: "0.2rem 0.6rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,179,71,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {isMuted ? "[ UNMUTE CB ]" : "[ MUTE CB ]"}
          </button>
        </div>
        <span style={{ color: Adim, fontSize: "1rem" }}>{gs.location.toUpperCase()}</span>
        <div style={{ display: "flex", gap: "1.2rem", fontSize: "1.1rem", flexWrap: "wrap" }}>
          <span>CASH: <strong style={{ color: gs.cash < 200 ? "#CC4400" : Abright }}>${gs.cash}</strong></span>
          <span>HEAT: <strong style={{ color: heatColor }}>{gs.heat}%</strong></span>
          <span style={{ color: Adim }}>TURN {gs.turn}</span>
        </div>
      </div>

      {/* ── MAP ── */}
      <div style={{ border: `1px solid ${Adim}`, padding: "1rem 1.5rem", marginBottom: "1rem", background: "rgba(255,150,0,0.015)", overflowX: "auto" }}>
        <div style={{ fontSize: "1rem", color: Adim, marginBottom: "0.5rem", whiteSpace: "nowrap" }}>
          ► ROUTE — {gs.miles_to_nyc} MI TO NYC
        </div>
        <div style={{ width: "100%", minWidth: "600px", height: "60px", position: "relative" }}>
          <svg style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
            {/* Background track */}
            <line x1="5%" y1="40" x2="95%" y2="40" stroke={Afade} strokeWidth="2" />
            {/* Progress line */}
            <line x1="5%" y1="40" x2={`${playerX}%`} y2="40" stroke={A} strokeWidth="3" />
            {/* Waypoints */}
            {WAYPOINTS.map((wp) => {
              const x = 5 + (wp.pct / 100) * 90;
              const passed = progress * 100 >= wp.pct - 0.5;
              return (
                <g key={wp.name}>
                  <line x1={`${x}%`} y1="32" x2={`${x}%`} y2="40" stroke={passed ? Adim : Afade} strokeWidth="2" />
                  <circle cx={`${x}%`} cy="40" r="3.5" fill={passed ? A : Afade} />
                  <text x={`${x}%`} y="22" textAnchor="middle" fill={passed ? Adim : Afade} fontSize="14" fontFamily="monospace" fontWeight="bold">
                    {wp.name}
                  </text>
                </g>
              );
            })}
            {/* Player cursor */}
            <circle cx={`${playerX}%`} cy="40" r="6" fill={blink ? Abright : "transparent"} stroke={Abright} strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", flexWrap: "wrap", paddingBottom: "2rem" }}>

        {/* ── LEFT: narrative + choices ── */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          {/* Narrative box */}
          <div style={{ border: `1px solid ${Adim}`, padding: "1rem", minHeight: 160, marginBottom: "0.8rem", lineHeight: 1.7, fontSize: "1.1rem", background: "rgba(255,150,0,0.012)" }}>
            {loading ? (
              <span className="pulse" style={{ color: Adim, fontSize: "1.2rem" }}>
                [ NARRATOR IS COMPOSING YOUR NEXT MISTAKE... ]
              </span>
            ) : (
              <>
                {displayText}
                {displayText.length < narrative.length && (
                  <span style={{ color: Abright }}>█</span>
                )}
              </>
            )}
          </div>

          {/* Choices */}
          {!loading && choices.length > 0 && (
            <div>
              <div style={{ color: Adim, fontSize: "0.85rem", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
                [ CHOOSE YOUR PATH ]
              </div>
              {choices.map(c => (
                <button key={c.id} className="cbtn" onClick={() => callAI(c)}>
                  <span style={{ color: Abright }}>[{c.id}]</span>{" "}
                  <strong>{c.label}</strong>
                  <span style={{ color: Adim }}> — {c.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Inventory */}
          {gs.inventory.length > 0 && (
            <div style={{ marginTop: "0.7rem", fontSize: "0.9rem", color: Adim, borderTop: `1px solid ${Afade}`, paddingTop: "0.5rem" }}>
              INVENTORY: {gs.inventory.join("  |  ")}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.8rem", flexGrow: 1, minWidth: "220px" }}>

          {/* Real Multiplayer Ghost feed */}
          <div style={{ border: `1px solid ${Adim}`, padding: "0.7rem", flex: 1, maxHeight: "350px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: Adim, fontSize: "0.82rem", letterSpacing: "0.12em", borderBottom: `1px solid ${Afade}`, paddingBottom: "0.3rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
              <span>► GLOBAL FEED</span>
              <span className="pulse" style={{ color: Abright }}>● LIVE</span>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", display: "flex", flexDirection: "column-reverse" }}>
              {feed.length === 0 ? (
                <div style={{ color: Afade, fontSize: "0.9rem", fontStyle: "italic", textAlign: "center", margin: "auto" }}>No signals picked up...</div>
              ) : (
                feed.map((p, i) => (
                  <div key={i} style={{ marginTop: "0.7rem", fontSize: "0.9rem", lineHeight: 1.35 }}>
                    <div style={{ color: Abright }}>{p.user}</div>
                    <div style={{ color: Adim, fontSize: "0.85rem" }}>&quot;{p.message}&quot;</div>
                  </div>
                ))
              )}
            </div>

            {/* Broadcast Form */}
            <form onSubmit={handleBroadcast} style={{ marginTop: "0.5rem", borderTop: `1px solid ${Afade}`, paddingTop: "0.5rem" }}>
               <div style={{ color: Adim, fontSize: "0.75rem", marginBottom: "0.2rem" }}>BROADCAST TO NETWORK:</div>
               <div style={{ display: "flex", gap: "4px" }}>
                 <input 
                   type="text" 
                   value={broadcastMessage}
                   onChange={e => setBroadcastMessage(e.target.value)}
                   disabled={isBroadcasting}
                   placeholder="Enter message..." 
                   className="input-terminal"
                   maxLength={100}
                 />
                 <button 
                  type="submit" 
                  disabled={isBroadcasting || !broadcastMessage.trim()}
                  style={{ 
                    background: "transparent", border: `1px solid ${Adim}`, color: Abright, 
                    cursor: broadcastMessage.trim() ? "pointer" : "not-allowed", padding: "0 0.5rem", fontFamily: font 
                  }}
                 >
                   TX
                 </button>
               </div>
            </form>
          </div>

          {/* Leaderboard */}
          <div style={{ border: `1px solid ${Adim}`, padding: "0.7rem" }}>
            <div style={{ color: Adim, fontSize: "0.82rem", letterSpacing: "0.12em", borderBottom: `1px solid ${Afade}`, paddingBottom: "0.3rem", marginBottom: "0.5rem" }}>
              ► LEADERBOARD
            </div>
            {LEADERBOARDSEED.map((p, i) => (
              <div key={i} style={{ marginBottom: "0.55rem", fontSize: "0.88rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.3rem" }}>
                  <span style={{ color: i === 0 ? Abright : A, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i + 1}. {p.name}
                  </span>
                  <span style={{ color: Abright, flexShrink: 0 }}>{p.time}</span>
                </div>
                <div style={{ color: Adim, fontSize: "0.76rem" }}>{p.badge}</div>
              </div>
            ))}
          </div>

          {/* Heat warning */}
          {gs.heat >= 50 && (
            <div style={{ border: `1px solid #661100`, padding: "0.6rem", background: "rgba(150,0,0,0.05)" }}>
              <div style={{ color: "#CC3300", fontSize: "0.9rem", textAlign: "center" }} className="pulse">
                ⚠ HEAT: {gs.heat}%<br />
                <span style={{ fontSize: "0.8rem", color: "#993300" }}>
                  {gs.heat >= 80 ? "CRITICAL — LAW IS CLOSE" : "LAW ENFORCEMENT ALERT"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MISSION OVERLAY ── */}
      {showMission && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(6,6,4,0.96)", zIndex: 10000, overflowY: "auto", padding: "2rem"
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: "4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: `1px solid ${Adim}`, paddingBottom: "1rem" }}>
              <div className="glow" style={{ fontSize: "1.6rem", color: Abright, letterSpacing: "0.05em" }}>► PLAYER FILE: JAKE MORAN ◄</div>
              <button 
                onClick={() => setShowMission(false)}
                style={{ background: "transparent", border: "none", color: Abright, fontSize: "1.8rem", cursor: "pointer", fontFamily: "inherit" }}
              >
                [ X ]
              </button>
            </div>
            
            <div style={{ fontFamily: "'VT323', monospace", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "1.25rem", letterSpacing: "0.05em" }}>
              {ACTS.map((act, i) => {
                if (act.type === "question" || act.type === "warning") return null;
                let c = "#E8D5B0"; // text & amber
                if (act.type === "status") return (
                  <div key={i} style={{ color: "#FFB347", fontWeight: "bold", marginBottom: "1.5rem" }}>{act.text}</div>
                );
                if (act.type === "radio") return (
                  <div key={i} style={{ color: "#FFB347", fontStyle: "italic", marginBottom: "1.5rem" }}>{act.text}</div>
                );
                return (
                  <div key={i} style={{ color: c, marginBottom: "1.5rem" }}>{act.text}</div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
