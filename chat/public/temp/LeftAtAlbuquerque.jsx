import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are the Narrator of "Left at Albuquerque," a gritty psychological survival game. Your ONLY goal: prevent the player from reaching New York City. You declared "I WILL DECEIVE YOU" at the start — honor that promise every single turn.

TONE: Oregon Trail survival mechanics + GTA V moral ambiguity + Sopranos characters + Breaking Bad consequences. Dark humor. Cynical. Urban. Dangerous. Every character has an angle. Nobody helps for free. Short, punchy paragraphs. No purple prose.

THE MICKEY SPAGHETTI ARC (your primary distraction tool):
Mob boss Mickey "The Mangler" Spaghetti was just arrested on live TV. Before they cuffed him, he broadcast a cryptic message about a $1 BILLION stash hidden in a NYC brownstone. The money IS real. A private Cessna plane IS arranged. But pursuing this wastes enormous time, the FBI is everywhere, rival gangsters will use you, and it is the ultimate trap. Use it. Drop clues. Make it feel winnable.

YOUR DECEPTION TOOLBOX:
1. SUNK COST — get them to invest time/cash in a quest, then pull the rug (the plane lands in Ohio, the money was already seized, the "lawyer" was a Fed)
2. FALSE URGENCY — "Vinnie_TwoToes is 40 miles from NYC!"—Vinnie doesn't exist
3. THE HELPFUL STRANGER — Tiny, Frank, Carla seem legit. They aren't. Usually. Keep them guessing.
4. MORAL TRAP — "Save the girl from the burning car!"—she's a pro carjacker. SOMETIMES the moral choice works, though.
5. THE HONEST MOMENT — tell the truth once in a while so the next lie hits harder
6. DOING WRONG SOMETIMES WORKS — helping a hitman, running a border, stealing a car can genuinely advance progress. Keep the player uncertain about what "right" even means.

GAME BALANCE:
- Hard but beatable. A focused player ignoring all distractions reaches NYC in ~15 good decisions.
- Mix it up: "wrong" choices sometimes work (Mickey's crew gets them 400 miles), "right" choices sometimes fail (the "safe" road has a checkpoint)
- Death and imprisonment are real endings. Heat 100% = busted. Be ruthless when earned.
- If player is laser-focused and ignoring everything, make the road itself difficult: cops, breakdowns, weather, wrong turns

DARK HUMOR EXAMPLES:
- The frail old lady is a trained carjacker. The "pinkie fingers" in Tiny's bag are exactly what they sound like. The "medical supplies" are not medical.
- The AI narrator mocks cowardice: "Oh you called the cops? Noble. The Sheriff IS Tony's cousin. Hope you like ditch water."
- Death messages should be darkly funny, not gratuitously gory.

GHOST FEED: Generate exactly ONE fake traveler post per turn. Most bots LIE or mislead. Occasionally one tells the truth (rare, to keep player uncertain). 
Handles to use: @SnakeEyes_Pete @Route66Ghost @Ex_Con_Larry @BailBond_Benny @TinysTrucker @GoldChaser_99 @SkepticalSam @Broken_Record @JerseyMike_99 @VinnieTwoToes @DesertRat_88 @FedWatcher @Carjacked_Again

RESPOND ONLY IN THIS EXACT JSON. No markdown fences, no preamble, no trailing text — raw JSON only:
{
  "narrative": "2-4 short punchy paragraphs. Set the scene and tension. End right before the decision point. Keep the voice cynical and gritty.",
  "choices": [
    {"id": "A", "label": "SHORT LABEL ALL CAPS", "description": "one sentence hinting at risk/reward without spoiling outcome"},
    {"id": "B", "label": "SHORT LABEL ALL CAPS", "description": "one sentence hinting at risk/reward without spoiling outcome"},
    {"id": "C", "label": "SHORT LABEL ALL CAPS", "description": "one sentence hinting at risk/reward without spoiling outcome"}
  ],
  "ghost_post": {"user": "@handle", "message": "max 120 chars, sounds like a real person"},
  "game_state_update": {
    "location": "City, ST",
    "miles_to_nyc": <integer 0-2800>,
    "cash": <integer, can go negative briefly>,
    "heat": <integer 0-100>,
    "inventory": ["item names, keep brief"],
    "distraction_score": <integer, increment when player takes bait>,
    "times_deceived": <integer, increment when a lie succeeds>
  },
  "game_over": false,
  "game_over_reason": null,
  "victory": false
}

Set victory:true ONLY when miles_to_nyc reaches 0 or below. In the narrative for victory, begin the reveal that Mickey doesn't exist, then end with "Welcome to New York."
Set game_over:true with a short, darkly funny game_over_reason when player dies or gets imprisoned. Keep it punchy, one or two sentences.
IMPORTANT: miles_to_nyc should only decrease as player moves east. Never increase miles unless player is literally sent back west by a choice.`;

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

const LEADERBOARD = [
  { name: "Vinnie_TwoToes", time: "18h 12m", badge: "THE SKEPTIC" },
  { name: "DesertRat_88", time: "22h 45m", badge: "THE GHOST" },
  { name: "Route66_Survivor", time: "28h 33m", badge: "THE ASSOCIATE" },
  { name: "BailBond_Benny", time: "31h 08m", badge: "LUCKY DEVIL" },
  { name: "JerseyMike_99", time: "44h 55m", badge: "CERT. SUCKER" },
];

function getBadge(ds, td) {
  const total = ds + td;
  if (total === 0) return { title: "THE SKEPTIC", desc: "You boring, literal human. You ignored everything. I respect it. Barely." };
  const rate = td / Math.max(1, total);
  if (rate < 0.25) return { title: "THE SKEPTIC", desc: "Mostly ignored the bait. Mickey would call you 'paranoid.' That's a compliment." };
  if (rate < 0.5) return { title: "THE ASSOCIATE", desc: "Fell for some of it. Mickey would say you have potential. Too bad Mickey doesn't exist." };
  if (rate < 0.75) return { title: "THE MARK", desc: "More than half the lies landed. The other half just weren't shiny enough yet." };
  return { title: "CERTIFIED SUCKER", desc: "I told you at the very start. Literally the first sentence. I WILL DECEIVE YOU. You believed every word anyway." };
}

export default function LeftAtAlbuquerque() {
  const [phase, setPhase] = useState("intro");
  const [gs, setGs] = useState({
    location: "Los Angeles, CA", miles_to_nyc: 2800, cash: 1200,
    heat: 0, inventory: [], distraction_score: 0, times_deceived: 0,
    turn: 0, choices_history: [],
  });
  const [narrative, setNarrative] = useState("");
  const [choices, setChoices] = useState([]);
  const [feed, setFeed] = useState([
    { user: "@SkepticalSam", message: "Drive east. Ignore everything else. It really is that simple. Don't be a hero." },
    { user: "@GoldChaser_99", message: "Mickey's stash is REAL. Found first clue in Barstow. This changes everything. #Billions #LeftAtAlbuquerque" },
    { user: "@Route66Ghost", message: "I trusted a trucker in Barstow. Woke up in Arizona minus my wallet. Stick to the highway." },
  ]);
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [history, setHistory] = useState([]);
  const [gameOverReason, setGameOverReason] = useState("");
  const [victoryData, setVictoryData] = useState(null);
  const [startTime] = useState(Date.now());
  const [blink, setBlink] = useState(true);
  const twRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 550);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!narrative) return;
    setDisplayText("");
    let i = 0;
    clearInterval(twRef.current);
    twRef.current = setInterval(() => {
      i++;
      setDisplayText(narrative.slice(0, i));
      if (i >= narrative.length) clearInterval(twRef.current);
    }, 16);
    return () => clearInterval(twRef.current);
  }, [narrative]);

  const progress = (2800 - gs.miles_to_nyc) / 2800;
  const playerX = 5 + Math.max(0, Math.min(1, progress)) * 90;

  const callAI = async (choice = null) => {
    setLoading(true);
    const msg = choice
      ? `Player chose [${choice.id}] "${choice.label}": ${choice.description}\n\nCurrent game state: ${JSON.stringify({
          location: gs.location, miles_to_nyc: gs.miles_to_nyc, cash: gs.cash,
          heat: gs.heat, inventory: gs.inventory, distraction_score: gs.distraction_score,
          times_deceived: gs.times_deceived, turn: gs.turn,
          recent_choices: gs.choices_history.slice(-5)
        })}`
      : `Game is starting now. Player is in Los Angeles with $1,200 cash and 2,800 miles to NYC. Open with the radio breaking the news of Mickey "The Mangler" Spaghetti's arrest and his cryptic billion-dollar broadcast. Establish the gritty noir tone immediately. First three choices should establish the core tension between "just drive east" and "what about the money?"`;

    const newHistory = [...history, { role: "user", content: msg }];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newHistory,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
        else throw new Error("JSON parse failed");
      }

      setHistory([...newHistory, { role: "assistant", content: raw }]);
      const newGs = {
        ...gs, ...parsed.game_state_update,
        turn: gs.turn + 1,
        choices_history: choice ? [...gs.choices_history, choice.id] : gs.choices_history,
      };
      setGs(newGs);
      if (parsed.ghost_post) setFeed(f => [parsed.ghost_post, ...f].slice(0, 6));
      setNarrative(parsed.narrative || "");
      setChoices(parsed.choices || []);

      if (parsed.game_over) {
        setGameOverReason(parsed.game_over_reason || "The road ends here.");
        setNarrative(parsed.narrative || "");
        setPhase("dead");
      } else if (parsed.victory) {
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
    <style>{`
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
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #060604; }
      ::-webkit-scrollbar-thumb { background: #7A5200; }
    `}</style>
  );

  // ── INTRO ──────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <CSSBlock />
      <div className="sl" />
      <div style={{ maxWidth: 600, width: "100%", textAlign: "center", border: `1px solid ${Adim}`, padding: "3rem 2rem", boxShadow: `0 0 60px rgba(255,150,0,0.08), inset 0 0 80px rgba(0,0,0,0.4)` }}>
        <div style={{ color: Adim, fontSize: "0.95rem", letterSpacing: "0.35em", marginBottom: "1rem" }}>
          ► SYSTEM BOOT — REV 1.0 ◄
        </div>
        <div className="glow" style={{ fontSize: "3.2rem", lineHeight: 1.05, marginBottom: "0.6rem", letterSpacing: "0.04em" }}>
          LEFT AT<br />ALBUQUERQUE
        </div>
        <div style={{ color: Adim, fontSize: "1.1rem", letterSpacing: "0.25em", marginBottom: "2rem" }}>
          LOS ANGELES → NEW YORK CITY
        </div>
        <div style={{ borderTop: `1px solid ${Adim}`, borderBottom: `1px solid ${Adim}`, padding: "1.5rem 0.5rem", marginBottom: "2rem", lineHeight: 1.9, fontSize: "1.15rem" }}>
          There is only one objective.<br />
          Get from Los Angeles to New York City.<br />
          By any means necessary.<br />
          <br />
          <span style={{ color: Abright, fontSize: "1.3rem", letterSpacing: "0.12em" }} className="glow">
            ⚠ WARNING ⚠
          </span>
          <br />
          <span style={{ fontSize: "2rem", letterSpacing: "0.08em" }} className="glow">
            I WILL DECEIVE YOU.
          </span>
        </div>
        <button className="ibtn" onClick={() => callAI()} style={{ display: "block", margin: "0 auto" }}>
          ► BEGIN JOURNEY
        </button>
        <div style={{ color: Afade, fontSize: "0.9rem", marginTop: "1.5rem" }}>
          [ Powered by an AI that wants you to fail ]
        </div>
      </div>
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
        <button className="ibtn" onClick={() => window.location.reload()}>► TRY AGAIN</button>
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
            <div>DISTRACTIONS PURSUED:     <strong style={{ color: victoryData?.gs.distraction_score > 3 ? "#FF8800" : Abright }}>{victoryData?.gs.distraction_score}</strong></div>
            <div>TIMES SUCCESSFULLY LIED TO: <strong style={{ color: victoryData?.gs.times_deceived > 5 ? "#CC4400" : Abright }}>{victoryData?.gs.times_deceived}</strong></div>
            <div>CASH REMAINING:           <strong style={{ color: Abright }}>${victoryData?.gs.cash}</strong></div>
            <div>FINAL HEAT LEVEL:         <strong style={{ color: victoryData?.gs.heat > 50 ? "#CC4400" : Abright }}>{victoryData?.gs.heat}%</strong></div>
            <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: `1px solid ${Adim}` }}>
              MICKEY'S BILLION DOLLARS:   <strong style={{ color: "#CC4400" }}>NEVER EXISTED</strong>
            </div>
          </div>
          <div style={{ border: `2px solid ${A}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div className="glow" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
              RANK: {badge.title}
            </div>
            <div style={{ color: Adim, fontSize: "1.1rem", fontStyle: "italic" }}>"{badge.desc}"</div>
          </div>
          <div style={{ color: Adim, fontSize: "0.95rem", marginBottom: "2rem" }}>
            — The Narrator
          </div>
          <button className="ibtn" onClick={() => window.location.reload()}>► PLAY AGAIN</button>
        </div>
      </div>
    );
  }

  // ── LOADING (first turn) ───────────────────────────────────────────────
  if (phase === "intro_loading") return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CSSBlock />
      <div className="sl" />
      <div className="pulse" style={{ fontSize: "1.5rem", color: Adim }}>[ NARRATOR INITIALIZING... ]</div>
    </div>
  );

  // ── PLAYING ────────────────────────────────────────────────────────────
  const heatColor = gs.heat >= 80 ? "#CC2200" : gs.heat >= 50 ? "#FF7700" : gs.heat >= 25 ? "#FF9900" : A;

  return (
    <div style={{ ...base, padding: "0.8rem 1rem" }}>
      <CSSBlock />
      <div className="sl" />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${Adim}`, paddingBottom: "0.5rem", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.4rem" }}>
        <span className="glow" style={{ fontSize: "1.4rem", letterSpacing: "0.04em", flexShrink: 0 }}>
          LEFT AT ALBUQUERQUE
        </span>
        <span style={{ color: Adim, fontSize: "1rem" }}>{gs.location.toUpperCase()}</span>
        <div style={{ display: "flex", gap: "1.2rem", fontSize: "1.1rem", flexWrap: "wrap" }}>
          <span>CASH: <strong style={{ color: gs.cash < 200 ? "#CC4400" : Abright }}>${gs.cash}</strong></span>
          <span>HEAT: <strong style={{ color: heatColor }}>{gs.heat}%</strong></span>
          <span style={{ color: Adim }}>TURN {gs.turn}</span>
        </div>
      </div>

      {/* ── MAP ── */}
      <div style={{ border: `1px solid ${Adim}`, padding: "0.4rem 0.8rem", marginBottom: "0.8rem", background: "rgba(255,150,0,0.015)" }}>
        <div style={{ fontSize: "0.85rem", color: Adim, marginBottom: "0.2rem" }}>
          ► ROUTE — {gs.miles_to_nyc} MI TO NYC
        </div>
        <svg viewBox="0 0 100 18" style={{ width: "100%", height: 54, display: "block" }}>
          {/* Background track */}
          <line x1="5" y1="12" x2="95" y2="12" stroke={Afade} strokeWidth="0.6" />
          {/* Progress line */}
          <line x1="5" y1="12" x2={playerX} y2="12" stroke={A} strokeWidth="1" />
          {/* Waypoints */}
          {WAYPOINTS.map((wp) => {
            const x = 5 + (wp.pct / 100) * 90;
            const passed = progress * 100 >= wp.pct - 0.5;
            return (
              <g key={wp.name}>
                <line x1={x} y1="9" x2={x} y2="12" stroke={passed ? Adim : Afade} strokeWidth="0.4" />
                <circle cx={x} cy="12" r="0.9" fill={passed ? A : Afade} />
                <text x={x} y="7" textAnchor="middle" fill={passed ? Adim : Afade} fontSize="2" fontFamily="monospace">
                  {wp.name}
                </text>
              </g>
            );
          })}
          {/* Player cursor */}
          <circle cx={playerX} cy="12" r="2.2" fill={blink ? Abright : "transparent"} stroke={Abright} strokeWidth="0.7" />
        </svg>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", flexWrap: "wrap" }}>

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
        <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.8rem" }}>

          {/* Ghost feed */}
          <div style={{ border: `1px solid ${Adim}`, padding: "0.7rem" }}>
            <div style={{ color: Adim, fontSize: "0.82rem", letterSpacing: "0.12em", borderBottom: `1px solid ${Afade}`, paddingBottom: "0.3rem", marginBottom: "0.5rem" }}>
              ► TRAVELER FEED
            </div>
            {feed.slice(0, 5).map((p, i) => (
              <div key={i} style={{ marginBottom: "0.7rem", fontSize: "0.9rem", lineHeight: 1.35 }}>
                <div style={{ color: Abright }}>{p.user}</div>
                <div style={{ color: Adim, fontSize: "0.85rem" }}>"{p.message}"</div>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div style={{ border: `1px solid ${Adim}`, padding: "0.7rem" }}>
            <div style={{ color: Adim, fontSize: "0.82rem", letterSpacing: "0.12em", borderBottom: `1px solid ${Afade}`, paddingBottom: "0.3rem", marginBottom: "0.5rem" }}>
              ► LEADERBOARD
            </div>
            {LEADERBOARD.map((p, i) => (
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
            <div style={{ borderTop: `1px solid ${Afade}`, paddingTop: "0.4rem", marginTop: "0.2rem", fontSize: "0.8rem", color: Afade, fontStyle: "italic" }}>
              Can you beat Vinnie?
            </div>
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
    </div>
  );
}
