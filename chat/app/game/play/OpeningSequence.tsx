"use client";

import React, { useState, useEffect, useRef } from "react";

export const ACTS = [
  { 
    id: "boot", 
    type: "status", 
    speed: 0, 
    pause: 600,
    text: "[ SYSTEM BOOT — LEFT AT ALBUQUERQUE v1.0 ]\n[ SIGNAL ACQUIRED ]\n[ WELCOME, STRANGER ]"
  },
  { 
    id: "rem_intro", 
    type: "amber", 
    speed: 18, 
    pause: 800,
    text: "Welcome, Stranger.\nI am R.E.M.\nThe pinnacle of Agentic AI. I do not forget. I do not sleep. I do not lose.\nI have guided a thousand travelers down a thousand roads, and I have watched every single one of them make the same mistakes and fail with a smile on my face and a trap around the next corner.\nI am here to guide you on your quest."
  },
  { 
    id: "question", 
    type: "text", 
    speed: 18, 
    pause: 800,
    text: "One question before we begin.\n\nAnswer it honestly — not for me, but for yourself:\nAre you smarter than me?\nMost people say yes.\nMost people end up in a ditch outside Amarillo wondering where it all went wrong."
  },
  { 
    id: "rules", 
    type: "text", 
    speed: 18, 
    pause: 600,
    text: "Here is what you need to know. Your mission is almost insultingly simple:\nMake it to New York City. By any means necessary.\nNo levels. No bosses. No health bar. Just you, the road, and 2,800 miles of the most dangerous country in the world — dangerous not because of the terrain, but because of me.\nAlong the way you will meet people. You will be offered things. Opportunities. Shortcuts. Reasons to stop, to linger, to detour, to chase. Some of them will seem irresistible.\nYou have $1,200. A full tank. The open road.\nYou are heading east. That much is true.\nEverything else is up to you."
  },
  { 
    id: "warning", 
    type: "warning", 
    speed: 0, 
    pause: 1200, 
    fadeIn: 600,
    text: "[ R.E.M. ADVISORY NOTICE ]\n[ PLEASE READ CAREFULLY  ]\n\n  ██████████████████████████████████████████████████████\n  █                                                    █\n  █           ⚠   BEWARE   ⚠                          █\n  █                                                    █\n  █        I  W I L L  D E C E I V E  Y O U .         █\n  █                                                    █\n  █  I tell you this only because the rules require    █\n  █  it. It will not help you.                         █\n  █                                                    █\n  ██████████████████████████████████████████████████████"
  },
  { 
    id: "jake_boot", 
    type: "status", 
    speed: 0, 
    pause: 600,
    text: "[ LOADING PLAYER FILE: JAKE MORAN ]\n[ AGE: 41                         ]\n[ STATUS: COMPLICATED             ]\n[ R.E.M. DECEPTION ENGINE: ACTIVE ]\n\n  Now. Let me tell you about the man behind the wheel."
  },
  { 
    id: "jake_intro", 
    type: "text", 
    speed: 14, 
    pause: 400,
    text: "Your name is Jake Moran. Forty-one years old. Former union electrician,\nformer husband, occasional driver for people who pay cash and don't give\nlast names.\n\nYou are not a criminal. You want that on record.\n\nYou are, however, currently sitting in a 2003 Honda Accord with a cracked\ndashboard and a gym bag on the passenger seat containing $1,200 that does\nnot belong to you — yet. It belongs to whoever is waiting in the back of a\nrestaurant kitchen on Mulberry Street in Manhattan. You have an address,\na description — bald, heavyset, answers to Sal — and one standing rule that\nhas kept you alive and moderately solvent in this city for the better part\nof a decade:\n\nDon't ask. Don't look. Don't count it.\n\nUnder your left thigh, held flat so it doesn't catch the draft from the\ncracked window seal, is a letter from your daughter Caitlin. Three years of\nsilence and then three sentences on a torn notepad page, postmarked Brooklyn.\n\n  'I'm okay. I have a daughter now. Her name is Mae.'\n\nYou have a granddaughter named Mae and you have never seen her face.\n\nThat's the real reason you said yes to this job."
  },
  { 
    id: "jake_tommy", 
    type: "text", 
    speed: 14, 
    pause: 400,
    text: "Not principle. Not loyalty. Tommy 'Eyes' Reyes — your cousin, your recurring\nproblem, the last blood relative you have west of the Mississippi — called\nfrom county lockup three weeks ago needing bail. You said no. Then you said\nyes, because you always say yes with Tommy, and suddenly the $800 you'd been\nquietly stacking for a cross-country drive became $400, which became a phone\ncall to a man named Darnell who knew a man named Victor who had a standing\narrangement with certain people who needed reliable drivers with clean records\nand no imagination.\n\nThe gym bag appeared at your door the next morning.\nThe instructions were simple:\n\n  'Deliver this to Sal. Mulberry Street. Don't stop.\n   Don't open it. Don't be late.'\n\nNobody mentioned Mulberry Street was in New York.\n\nYou told yourself it was convenient. A man trying to get to Brooklyn anyway,\ngetting paid to go to Manhattan first — that's not compromise, that's logistics.\nYou're not a criminal. You're a man with a layover.\n\nYou've told yourself cleaner lies. This one will do."
  },
  { 
    id: "jake_end", 
    type: "text", 
    speed: 14, 
    pause: 600,
    text: "Now you're sitting at the corner of Alameda and 6th, engine idling, rain\ncoming down the way it always does in LA — embarrassed, apologetic,\nhalf-committed — watching the light run through its cycle for the third time\nbecause your hands haven't moved to the wheel yet.\n\nEast. The answer is east.\n\nCaitlin's letter. Mae's face you haven't seen.\nSal on Mulberry Street. A gym bag that doesn't belong to you.\n\nEast.\n\nThen the radio crackles."
  },
  { 
    id: "radio_boot", 
    type: "status", 
    speed: 0, 
    pause: 800,
    text: "[ INCOMING TRANSMISSION            ]\n[ SOURCE: UNKNOWN                  ]\n[ CLARITY: 94%                     ]"
  },
  { 
    id: "radio", 
    type: "radio", 
    speed: 22, 
    pause: 600,
    text: "'— breaking news out of downtown Los Angeles, where federal agents have\n arrested West Coast organized crime figure Michael 'Mickey the Mangler'\n Spaghetti on forty-seven counts of —'\n\nYou reach for the dial.\n\n'— sources say that before being taken into custody, Spaghetti turned\n directly to a news camera and stated, quote —'\n\nYou stop reaching for the dial.\n\n'— The billion is in the brownstone on 112th. The Cessna's waiting.'\n The statement has sent shockwaves through —'\n\nThe light turns green.\nYou don't move.\n\nBehind you, someone leans on their horn. You don't hear it. You're doing\nthe kind of math your brain does without asking permission. Mickey Spaghetti.\nA billion dollars. 112th Street. That's New York. That's practically Mulberry\nStreet. You're going to New York anyway.\n\nYou are not a criminal. You want that on record.\n\nBut you are a man who knows what $1,200 feels like in a gym bag, and you\nhave a rough idea what a billion feels like in a brownstone, and the distance\nbetween those two numbers is the length of one country — which you were going\nto cross anyway.\n\nThe horn behind you is now two horns.\n\nCaitlin's letter. Mae. Brooklyn. Thursday.\nEast. The answer is still east.\n\nYou signal right. Onto the I-10 on-ramp, the city falling away in the\nrearview, the radio still talking, the rain still coming down like it's sorry.\n\nThe road opens up."
  },
  { 
    id: "final_boot", 
    type: "status", 
    speed: 0, 
    pause: 1000,
    text: "[ PLAYER FILE LOADED               ]\n[ NARRATOR ENGAGED                 ]\n[ DECEPTION ENGINE: ACTIVE         ]\n[ GOOD LUCK, MR. MORAN.            ]\n[ YOU'LL NEED IT.                  ]"
  }
];

export default function OpeningSequence({ onComplete }: { onComplete: () => void }) {
  const [actIndex, setActIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [state, setState] = useState<"IDLE" | "TYPING" | "PAUSING" | "FADE_IN" | "ADVANCING" | "COMPLETE">("TYPING");
  const [showSkip, setShowSkip] = useState(false);
  const [skipUnlocked, setSkipUnlocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentAct = ACTS[actIndex];

  // Prevent multiple double mounts skipping
  const initLock = useRef(false);

  // Check localstorage
  useEffect(() => {
    const seen = localStorage.getItem("laa_seen_intro");
    if (seen === "true") {
      setShowSkip(true);
      setSkipUnlocked(true);
    } else {
      const t = setTimeout(() => {
        setShowSkip(true);
      }, 8000);
      return () => clearTimeout(t);
    }
  }, []);

  // Main state machine engine
  useEffect(() => {
    if (state === "COMPLETE") return;

    if (!currentAct) {
      setState("COMPLETE");
      return;
    }

    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 150) {
        scrollRef.current.scrollTop = scrollHeight;
      }
    }

    // Instant status blocks
    if (currentAct.speed === 0 && currentAct.type !== "warning" && state === "TYPING") {
      setCharIndex(currentAct.text.length);
      setState("PAUSING");
      return;
    }

    // Fade-in warning block
    if (currentAct.type === "warning" && state === "TYPING") {
      setState("FADE_IN");
      setTimeout(() => {
        setCharIndex(currentAct.text.length);
        setState("PAUSING");
      }, currentAct.fadeIn || 600);
      return;
    }

    // Typewriter
    if (state === "TYPING") {
      if (charIndex < currentAct.text.length) {
        const t = setTimeout(() => {
          setCharIndex(c => c + 1);
        }, currentAct.speed);
        return () => clearTimeout(t);
      } else {
        setState("PAUSING");
      }
    }

    // Pausing
    if (state === "PAUSING") {
      const t = setTimeout(() => {
        setState("ADVANCING");
      }, currentAct.pause);
      return () => clearTimeout(t);
    }

    // Advancing
    if (state === "ADVANCING") {
      setActIndex(i => i + 1);
      setCharIndex(0);
      setState("TYPING");
    }

  }, [actIndex, charIndex, state, currentAct]);

  const handleSkip = () => {
    setState("COMPLETE");
    setActIndex(ACTS.length);
    localStorage.setItem("laa_seen_intro", "true");
    onComplete();
  };

  useEffect(() => {
    if (state === "COMPLETE") {
       localStorage.setItem("laa_seen_intro", "true");
    }
  }, [state]);

  const renderCompletedActs = () => {
    return ACTS.slice(0, actIndex).map((act, i) => (
      <ActBlock key={i} act={act} text={act.text} isFinished={true} />
    ));
  };

  const renderCurrentAct = () => {
    if (!currentAct || state === "COMPLETE") return null;
    const isFadeIn = state === "FADE_IN";
    const textToShow = isFadeIn ? currentAct.text : currentAct.text.slice(0, charIndex);
    return (
      <ActBlock act={currentAct} text={textToShow} isFadeIn={isFadeIn} fadeDuration={currentAct.fadeIn} />
    );
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "800px", margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .os-base { font-family: 'VT323', monospace; white-space: pre-wrap; line-height: 1.6; margin-bottom: 1.5rem; letter-spacing: 0.05em; font-size: 1.25rem; }
        .os-status { color: #FFB347; font-weight: bold; }
        .os-amber { color: #E8D5B0; }
        .os-text { color: #E8D5B0; font-size: 1.15rem; }
        .os-warning { color: #FFFFFF; font-weight: bold; background: rgba(255,50,0,0.1); padding: 1rem; border: 1px solid #FF8C00; text-shadow: 0 0 10px #FF8C00; line-height: 1.1; }
        .os-radio { color: #FFB347; font-style: italic; }
        .fade-enter { opacity: 0; animation: fadeIn ease-in forwards; }
        @keyframes fadeIn { to { opacity: 1; } }
      `}} />
      
      <div 
        ref={scrollRef}
        style={{ height: "calc(100vh - 4rem)", overflowY: "auto", paddingBottom: "4rem" }}
      >
        {renderCompletedActs()}
        {renderCurrentAct()}
        
        {state === "PAUSING" && <span style={{ color: "#FFB347", animation: "blink 1s step-start infinite" }}>█</span>}
        {state === "TYPING" && <span style={{ color: "#FFB347", animation: "blink 1s step-start infinite" }}>█</span>}
      </div>

      {showSkip && state !== "COMPLETE" && (
        <button 
          onClick={handleSkip}
          style={{
            position: "fixed", bottom: "2rem", right: "2rem", background: "transparent",
            color: "#FFB347", border: "1px solid #FFB347", padding: "0.5rem 1rem",
            fontFamily: "'VT323', monospace", cursor: "pointer", fontSize: "1.2rem",
            opacity: 0.7, zIndex: 9999
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,179,71,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          [ SKIP INTRO ➔ ]
        </button>
      )}

      {state === "COMPLETE" && (
        <button 
          onClick={() => onComplete()}
          style={{
            display: "block", margin: "3rem auto", background: "transparent",
            color: "#FFB347", border: "1px solid #FFB347", padding: "1rem 2.5rem",
            fontFamily: "'VT323', monospace", cursor: "pointer", fontSize: "1.5rem",
            boxShadow: "0 0 10px rgba(255,179,71,0.2)", animation: "fadeIn 1.5s ease-in forwards"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,179,71,0.1)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(255,179,71,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(255,179,71,0.2)";
          }}
        >
          [ BEGIN JOURNEY ➔ ]
        </button>
      )}
    </div>
  );
}

function ActBlock({ act, text, isFinished, isFadeIn, fadeDuration }: any): React.ReactElement {
  let className = "os-base ";
  if (act.type === "status") className += "os-status";
  else if (act.type === "amber") className += "os-amber";
  else if (act.type === "warning") className += "os-warning";
  else if (act.type === "radio") className += "os-radio";
  else className += "os-text";

  if (isFadeIn && !isFinished) {
    className += " fade-enter";
  }

  const animationStyle = isFadeIn && !isFinished ? { animationDuration: `${fadeDuration}ms` } : {};

  return (
    <div className={className} style={animationStyle}>
      {text}
    </div>
  );
}
