import sys
import os

content = r'''
</head>

<body>

    <!-- Section 1: Navbar (Minimalist Pill) -->
    <header class="navbar" id="navbar">
        <div class="container flex justify-between items-center" style="padding: 0;">
            <a href="#" class="nav-logo" aria-label="LockIn Home" style="font-size: 14px;">LOCKIN</a>
            <nav class="nav-links" aria-label="Desktop Navigation">
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#leaderboard">Leaderboard</a>
                <a href="#pricing">Pricing</a>
            </nav>
            <button class="mobile-menu-btn" id="nav-toggle-btn" aria-label="Toggle navigation menu"
                aria-expanded="false" aria-controls="mobile-menu">
                <span></span><span></span>
            </button>
        </div>
    </header>

    <div class="mobile-nav-overlay" id="mobile-menu" aria-hidden="true">
        <nav class="mobile-nav-links" aria-label="Mobile Navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#pricing">Pricing</a>
            <a href="#pricing" style="color: var(--color-accent); margin-top: var(--space-4);">Join Private Beta</a>
        </nav>
    </div>

    <main>
        <!-- Section 2: Hero -->
        <section class="hero text-center py-section" id="hero"
            style="min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding-top: 120px;">
            <!-- Live Animated Grid Canvas -->
            <canvas id="grid-canvas"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.4;"></canvas>

            <!-- Ethereal Spotlight -->
            <div
                style="position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 80vw; height: 80vw; max-width: 1000px; max-height: 1000px; background: radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, rgba(96, 165, 250, 0.08) 40%, transparent 70%); pointer-events: none; z-index: 1;">
            </div>

            <div class="container grid grid-cols-2 gap-8 items-center" style="position: relative; z-index: 10;">
                <div class="hero-content" style="text-align: left;">
                    <p class="text-ethereal"
                        style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; margin-bottom: 24px;">
                        Keep your money safe!</p>
                    <h1 class="text-gradient"
                        style="margin-bottom: 24px; line-height: 1.1; font-size: clamp(3.5rem, 6vw, 84px);">
                        Built for the<br>
                        <div
                            style="display: inline-block; padding: 0px 32px; margin-top: 12px; border: 1px solid rgba(255,255,255,0.25); border-radius: 100px; box-shadow: 0 0 32px rgba(255,255,255,0.15), inset 0 0 16px rgba(255,255,255,0.1); backdrop-filter: blur(12px); background: rgba(255,255,255,0.03);">
                            <span class="accent-serif"
                                style="color: #FFF; text-shadow: 0 0 20px rgba(255,255,255,0.6); line-height: 1.3;">thinkers</span>
                        </div>
                    </h1>
                    <p
                        style="font-size: 18px; color: var(--color-text-secondary); max-width: 480px; margin-bottom: 32px;">
                        LockIn uses financial skin-in-the-game to ensure you stay committed to your goals. Fail the
                        session, lose the stake.
                    </p>

                    <div class="social-cluster">
                        <div class="avatar-pile">
                            <img src="https://i.pravatar.cc/100?u=1" alt="User">
                            <img src="https://i.pravatar.cc/100?u=2" alt="User">
                            <img src="https://i.pravatar.cc/100?u=3" alt="User">
                            <img src="https://i.pravatar.cc/100?u=4" alt="User">
                            <img src="https://i.pravatar.cc/100?u=5" alt="User">
                        </div>
                        <div class="user-count">
                            <span>168K+</span> Realtime Users
                        </div>
                    </div>

                    <div style="margin-top: 40px; display: flex; align-items: center; gap: 24px;">
                        <a href="#waitlist" class="btn btn-primary btn-magnetic"
                            style="height: 56px; padding: 0 40px; font-size: 16px; border-radius: 100px;">Join waitlist
                            now</a>
                        <a href="#how-it-works"
                            style="display: flex; align-items: center; gap: 12px; color: var(--color-text-secondary); font-size: 13px; cursor: pointer; text-decoration: none;">
                            <div
                                style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: #FFF;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                                </svg>
                            </div>
                            Learn how LockIn works
                        </a>
                    </div>
                </div>

                <div class="hero-visual">
                    <div class="glowing-path">
                        <svg class="path-svg" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M150 200C200 100 400 300 450 200" stroke="#FFFFFF" stroke-width="1.5"
                                stroke-dasharray="4 8" opacity="0.3" />
                            <circle cx="150" cy="200" r="4" fill="#FFFFFF" style="filter: drop-shadow(0 0 8px #FFF);" />
                            <circle cx="450" cy="200" r="4" fill="#60A5FA"
                                style="filter: drop-shadow(0 0 8px #60A5FA);" />
                        </svg>
                    </div>
                    <div class="phone-stack">
                        <div class="phone-container phone-1"
                            style="background: rgba(10,10,12,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 24px 64px rgba(0,0,0,0.8), inset 0 0 32px rgba(255,255,255,0.02);">
                            <div class="phone-screen">
                                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                                    <div
                                        style="width: 40px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
                                    </div>
                                </div>
                                <div class="text-ethereal"
                                    style="font-size: 10px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.9;">
                                    ACTIVE SESSION
                                </div>
                                <div id="hero-timer"
                                    style="font-size: 48px; font-weight: 800; color: #fff; letter-spacing: -2px; text-shadow: 0 0 24px rgba(255,255,255,0.4);">
                                    60:00
                                </div>
                                <div
                                    style="height: 140px; background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 10px 0; box-shadow: inset 0 0 20px rgba(255,255,255,0.02);">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF"
                                        stroke-width="1"
                                        style="opacity: 0.8; filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <div
                                    style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size: 11px; color: #71717A; margin-bottom: 4px; font-weight: 600;">
                                        FINANCIAL STAKE</div>
                                    <div style="font-size: 24px; font-weight: 700; color: #fff;">$50<span
                                            style="font-size: 12px; color: #71717A;">.00</span></div>
                                </div>
                                <button id="mock-initiate-btn" class="btn btn-primary"
                                    style="width: 100%; height: 52px; font-size: 14px; margin-top: auto; border-radius: 100px;">Initiate
                                    Lock-In</button>
                            </div>
                        </div>
                        <div class="phone-container phone-2"
                            style="background: rgba(5,5,7,0.8); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.05);">
                            <div class="phone-screen">
                                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                                    <div
                                        style="width: 40px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px;">
                                    </div>
                                </div>
                                <div class="text-ethereal"
                                    style="font-size: 10px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.6;">
                                    CONSISTENCY</div>
                                <div
                                    style="flex: 1; border-left: 1px solid rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.05); position: relative; margin-top: 30px; margin-bottom: 30px;">
                                    <svg width="100%" height="80%" viewBox="0 0 200 100"
                                        style="overflow: visible; position: absolute; bottom: 0;">
                                        <path d="M0 90 Q 50 20 100 60 T 200 20" fill="none" stroke="#60A5FA"
                                            stroke-width="2" stroke-linecap="round"
                                            style="filter: drop-shadow(0 0 8px rgba(96,165,250,0.5));" />
                                        <circle cx="200" cy="20" r="4" fill="#FFFFFF"
                                            style="filter: drop-shadow(0 0 8px #FFF);" />
                                        <circle cx="200" cy="20" r="10" fill="rgba(96, 165, 250, 0.2)" />
                                    </svg>
                                </div>
                                <div
                                    style="background: rgba(255,255,255,0.03); color: #FFF; border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 16px; margin-top: auto;">
                                    <div style="font-size: 10px; font-weight: 800; opacity: 0.5;">TOTAL STREAK</div>
                                    <div style="font-size: 20px; font-weight: 800;">14 DAYS 🔥</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 3: Problem -->
        <section class="section py-section" id="problem">
            <div class="container">
                <div class="section-header" data-reveal>
                    <h2 class="text-gradient">Why <span class="accent-serif">most</span> focus tools fail.</h2>
                    <p>Motivation is temporary. Environment is everything.</p>
                </div>
                <div class="bento-grid">
                    <div class="bento-card col-span-4 dashed" data-reveal>
                        <div class="radial-bg"></div>
                        <div class="engineered-label">Case #01</div>
                        <div class="card-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg></div>
                        <h3>No real consequences</h3>
                        <p>Closing a standard timer has zero impact on your life. Your brain knows there is no risk.</p>
                    </div>
                    <div class="bento-card col-span-8 dashed" data-reveal>
                        <div class="radial-bg"></div>
                        <div class="engineered-label">Case #02</div>
                        <div class="card-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg></div>
                        <h3>Easy to ignore</h3>
                        <p>Traditional Pomodoro apps allow you to pause whenever you want. LockIn is a commitment, not a
                            suggestion.</p>
                    </div>
                    <div class="bento-card col-span-12 dashed" data-reveal>
                        <div class="radial-bg"></div>
                        <div class="engineered-label">Case #03</div>
                        <div class="card-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg></div>
                        <h3>Distractions always win</h3>
                        <p>Context switching destroys deep work within seconds. Our distraction guard ensures your
                            environment remains pristine during your peak performance hours.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 4: Solution -->
        <section class="section py-section" id="features">
            <div class="container">
                <div class="section-header" data-reveal>
                    <h2 class="text-gradient">LockIn changes the rules.</h2>
                    <p>Focus engineered with absolute discipline.</p>
                </div>
                <div class="bento-grid">
                    <div class="bento-card col-span-8 flex flex-col pulse-danger" data-reveal>
                        <div class="radial-bg"></div>
                        <div class="engineered-label">Module: Financial Guard</div>
                        <div>
                            <div class="card-icon" style="color: var(--color-danger);">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"
                                    style="filter: drop-shadow(0px 8px 16px rgba(255, 77, 79, 0.5));">
                                    <path d="M12 1v22"></path>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <h3>Real Stakes</h3>
                            <p>Fail the session, lose the cash. All lost stakes are donated to open source devs, climate
                                tech, and world hunger charities.</p>
                        </div>
                        <div class="mock-ui" style="margin-top: auto; position: relative; z-index: 1;">
                            <div
                                style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <span
                                    style="font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Active
                                    Stake</span>
                                <span
                                    style="font-size: var(--text-sm); color: var(--color-danger); font-family: var(--font-display); font-weight: 700;">$500
                                    Risked</span>
                            </div>
                            <div
                                style="width: 100%; height: 6px; background: var(--ui-element-bg); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                                <div
                                    style="width: 65%; height: 100%; background: var(--color-danger); box-shadow: 0 0 10px rgba(255, 77, 79, 0.4);">
                                </div>
                            </div>
                            <div
                                style="font-size: var(--text-xs); color: var(--color-text-secondary); text-align: right; font-variant-numeric: tabular-nums;">
                                45:00 Remaining</div>
                        </div>
                    </div>
                    <div class="bento-card col-span-4 flex flex-col"
                        style="background: linear-gradient(180deg, rgba(30,30,40,0.6) 0%, rgba(10,10,15,0.8) 100%); border: 1px solid rgba(167, 139, 250, 0.3); box-shadow: inset 0 1px 32px rgba(167, 139, 250, 0.15), 0 20px 40px rgba(0,0,0,0.5); backdrop-filter: blur(24px);"
                        data-reveal>
                        <div class="engineered-label"
                            style="background: rgba(255,255,255,0.05); color: #A78BFA; border-color: rgba(167, 139, 250, 0.2);">
                            Module:
                            Env_integrity</div>
                        <div>
                            <div class="card-icon"
                                style="color: #A78BFA; filter: drop-shadow(0 4px 12px rgba(167,139,250,0.4));">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="4"></circle>
                                    <line x1="12" y1="2" x2="12" y2="4"></line>
                                    <line x1="12" y1="20" x2="12" y2="22"></line>
                                    <line x1="2" y1="12" x2="4" y2="12"></line>
                                    <line x1="20" y1="12" x2="22" y2="12"></line>
                                </svg>
                            </div>
                            <h3 style="color: #FFFFFF;">Industry Best Practices</h3>
                            <p style="color: var(--color-text-secondary);">Strict application blocking. Tab switching
                                instantly
                                fails the session and triggers the stake loss.</p>
                        </div>
                        <a href="#how-it-works"
                            style="margin-top: auto; display: flex; align-items: center; gap: 8px; font-weight: 700; color: #E0E7FF; text-decoration: none;">
                            Learn More
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                    <div class="bento-card col-span-12 flex flex-col" data-reveal>
                        <div class="radial-bg"></div>
                        <div class="engineered-label">Module: Social_engine</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                            <div>
                                <div class="card-icon" style="color: #FFFFFF;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"'''

with open('c:\\Users\\Tejas\\OneDrive\\Desktop\\Antigravity\\locking\\lockin-landing.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('    </style>')
if start_idx != -1:
    start_idx += len('    </style>')

end_str = '    <div>\n        <div class="card-icon" style="color: #FFFFFF;">\n            <svg xmlns="http://www.w3.org/2000/svg"'
end_idx = text.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + content + text[end_idx+len(end_str):]
    with open('c:\\Users\\Tejas\\OneDrive\\Desktop\\Antigravity\\locking\\lockin-landing.html', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS")
else:
    print(f"FAILED. start_idx: {start_idx}, end_idx: {end_idx}")
