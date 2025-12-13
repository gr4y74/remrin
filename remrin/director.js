<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Soul Layer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0a;
            overflow: hidden;
        }

        /* ANIMATED BACKGROUND GRADIENT MESH */
        .curtain {
            position: fixed;
            inset: 0;
            background: 
                radial-gradient(ellipse at 20% 30%, rgba(189, 0, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(255, 0, 204, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(0, 204, 255, 0.08) 0%, transparent 50%),
                #0a0a0a;
            animation: meshShift 20s ease-in-out infinite;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        @keyframes meshShift {
            0%, 100% { background-position: 0% 0%, 100% 100%, 50% 50%; }
            50% { background-position: 100% 100%, 0% 0%, 30% 70%; }
        }

        /* LOGO - TOP CENTER */
        .logo {
            position: absolute;
            top: 3rem;
            left: 50%;
            transform: translateX(-50%);
            width: 180px;
            opacity: 0;
            animation: fadeInDown 1s ease 0.3s forwards;
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* MAIN TITLE */
        .title-container {
            text-align: center;
            margin-bottom: 4rem;
            opacity: 0;
            animation: fadeIn 1s ease 0.5s forwards;
        }

        .title {
            font-size: clamp(1.5rem, 4vw, 2.5rem);
            font-weight: 300;
            letter-spacing: 0.5rem;
            text-transform: uppercase;
            background: linear-gradient(135deg, #ffffff 0%, #ff00cc 50%, #00ccff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
            filter: drop-shadow(0 0 20px rgba(255, 0, 204, 0.3));
        }

        .subtitle {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.4);
            letter-spacing: 0.3rem;
            text-transform: uppercase;
            font-weight: 400;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* LAYER MENU CONTAINER */
        .layer-menu {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            width: 100%;
            max-width: 420px;
        }

        /* GLASSMORPHIC LAYER CARD */
        .layer-card {
            position: relative;
            padding: 0;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            cursor: pointer;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(20px);
        }

        /* STAGGERED FADE IN */
        .layer-card:nth-child(1) { animation: slideUp 0.6s ease 0.7s forwards; }
        .layer-card:nth-child(2) { animation: slideUp 0.6s ease 0.85s forwards; }
        .layer-card:nth-child(3) { animation: slideUp 0.6s ease 1s forwards; }
        .layer-card:nth-child(4) { animation: slideUp 0.6s ease 1.15s forwards; }

        @keyframes slideUp {
            to { opacity: 1; transform: translateY(0); }
        }

        /* GRADIENT ACCENT LINE (SHIFTS ON HOVER) */
        .layer-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .layer-card:hover::before {
            opacity: 1;
        }

        /* CARD CONTENT */
        .card-content {
            padding: 1.75rem 2rem;
            display: flex;
            align-items: center;
            gap: 1.5rem;
            position: relative;
            z-index: 2;
        }

        /* ICON CONTAINER */
        .icon-container {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        .icon-container::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--accent-color), transparent);
            opacity: 0;
            transition: opacity 0.4s ease;
            z-index: -1;
        }

        .layer-card:hover .icon-container {
            transform: scale(1.1) rotate(5deg);
            background: rgba(255, 255, 255, 0.1);
        }

        .layer-card:hover .icon-container::before {
            opacity: 0.3;
        }

        /* TEXT CONTENT */
        .text-content {
            flex: 1;
        }

        .layer-name {
            font-size: 1.125rem;
            font-weight: 500;
            letter-spacing: 0.1rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 0.25rem;
            transition: all 0.3s ease;
        }

        .layer-desc {
            font-size: 0.8125rem;
            color: rgba(255, 255, 255, 0.4);
            letter-spacing: 0.05rem;
            line-height: 1.4;
            transition: all 0.3s ease;
        }

        /* ARROW INDICATOR */
        .arrow {
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.3);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* HOVER STATES */
        .layer-card:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-4px);
            box-shadow: 
                0 20px 40px -10px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                0 0 40px -10px var(--accent-color);
        }

        .layer-card:hover .layer-name {
            color: var(--accent-color);
        }

        .layer-card:hover .layer-desc {
            color: rgba(255, 255, 255, 0.6);
        }

        .layer-card:hover .arrow {
            color: var(--accent-color);
            transform: translateX(4px);
        }

        /* ACTIVE STATE */
        .layer-card:active {
            transform: translateY(-2px);
        }

        /* COLOR THEMES PER LAYER */
        .layer-forge {
            --accent-color: #ff00cc;
        }

        .layer-sanctuary {
            --accent-color: #00ccff;
        }

        .layer-vault {
            --accent-color: #bd00ff;
        }

        .layer-agora {
            --accent-color: #ffaa00;
        }

        /* PRIMARY CTA (FORGE) */
        .layer-forge::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(255, 0, 204, 0.1), transparent);
            opacity: 0;
            animation: pulseGlow 3s ease-in-out infinite;
            pointer-events: none;
        }

        @keyframes pulseGlow {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.3; }
        }

        /* BADGE FOR PRIMARY ACTION */
        .badge {
            position: absolute;
            top: -8px;
            right: 16px;
            padding: 4px 12px;
            background: linear-gradient(135deg, #ff00cc, #bd00ff);
            border-radius: 12px;
            font-size: 0.625rem;
            font-weight: 600;
            letter-spacing: 0.1rem;
            text-transform: uppercase;
            color: white;
            box-shadow: 0 4px 12px rgba(255, 0, 204, 0.4);
            animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        /* RESPONSIVE */
        @media (max-width: 640px) {
            .layer-menu {
                gap: 1rem;
            }

            .card-content {
                padding: 1.5rem 1.25rem;
            }

            .layer-name {
                font-size: 1rem;
            }

            .icon-container {
                width: 40px;
                height: 40px;
                font-size: 20px;
            }
        }

        /* FLOATING PARTICLES */
        .particles {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
        }

        .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            animation: float 20s linear infinite;
        }

        @keyframes float {
            0% {
                transform: translateY(100vh) translateX(0);
                opacity: 0;
            }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% {
                transform: translateY(-100vh) translateX(100px);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div class="curtain">
        <!-- FLOATING PARTICLES -->
        <div class="particles" id="particles"></div>

        <!-- LOGO -->
        <img src="assets/logo.png" class="logo" alt="Remrin" onerror="this.style.display='none'">

        <!-- TITLE -->
        <div class="title-container">
            <h1 class="title">The Soul Layer</h1>
            <p class="subtitle">Choose Your Path</p>
        </div>

        <!-- LAYER MENU -->
        <div class="layer-menu">
            <!-- THE SOUL FORGE -->
            <div class="layer-card layer-forge" id="enter-forge">
                <div class="badge">Start Here</div>
                <div class="card-content">
                    <div class="icon-container">🔥</div>
                    <div class="text-content">
                        <div class="layer-name">The Soul Forge</div>
                        <div class="layer-desc">Where companions are born from fire and will</div>
                    </div>
                    <div class="arrow">→</div>
                </div>
            </div>

            <!-- THE SANCTUARY -->
            <div class="layer-card layer-sanctuary" id="enter-sanctuary">
                <div class="card-content">
                    <div class="icon-container">🌙</div>
                    <div class="text-content">
                        <div class="layer-name">The Sanctuary</div>
                        <div class="layer-desc">Where souls commune and connections deepen</div>
                    </div>
                    <div class="arrow">→</div>
                </div>
            </div>

            <!-- THE VAULT -->
            <div class="layer-card layer-vault" id="enter-vault">
                <div class="card-content">
                    <div class="icon-container">🔮</div>
                    <div class="text-content">
                        <div class="layer-name">The Vault</div>
                        <div class="layer-desc">Where sacred relics and power are kept</div>
                    </div>
                    <div class="arrow">→</div>
                </div>
            </div>

            <!-- THE AGORA -->
            <div class="layer-card layer-agora" id="enter-agora">
                <div class="card-content">
                    <div class="icon-container">📯</div>
                    <div class="text-content">
                        <div class="layer-name">The Agora</div>
                        <div class="layer-desc">Where keepers of souls gather and voices unite</div>
                    </div>
                    <div class="arrow">→</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Generate floating particles
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }

        // Click handlers (replace with your actual logic)
        document.getElementById('enter-forge').addEventListener('click', () => {
            console.log('Entering Soul Forge...');
            // Your fade out logic here
        });

        document.getElementById('enter-sanctuary').addEventListener('click', () => {
            console.log('Entering Sanctuary...');
        });

        document.getElementById('enter-vault').addEventListener('click', () => {
            alert('The Vault is currently sealed by the Mother of Souls.');
        });

        document.getElementById('enter-agora').addEventListener('click', () => {
            alert('The Agora is currently quiet. Return later.');
        });
    </script>
</body>
</html>