const fs = require('fs');
const file = 'c:/Users/Tejas/OneDrive/Desktop/Antigravity/locking/lockin-landing.html';
let content = fs.readFileSync(file, 'utf8');

const regexCSS = /\/\* 11\. Final CTA \*\/[\s\S]*?\/\* 12\. Checkout Modal Refinements \*\//;
const newCSS = `/* 11. Vortex Waitlist CTA */
        .vortex-section {
            position: relative;
            background: #000;
            padding: 160px 0;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border-top: 1px solid rgba(255,255,255,0.05);
        }

        .vortex-glow {
            position: absolute;
            bottom: -50px;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 400px;
            background: radial-gradient(ellipse at center, rgba(230, 230, 200, 0.08) 0%, transparent 60%);
            z-index: 1;
            pointer-events: none;
        }

        .vortex-grid-wrapper {
            position: absolute;
            bottom: 0px;
            width: 100vw;
            height: 400px;
            z-index: 2;
            opacity: 0.15;
            mask-image: linear-gradient(to top, black 20%, transparent 90%);
            -webkit-mask-image: linear-gradient(to top, black 20%, transparent 90%);
        }

        .vortex-grid-svg {
            width: 100%;
            height: 100%;
            min-width: 1200px;
        }

        .vortex-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .vortex-envelope-wrapper {
            position: relative;
            z-index: 3;
            margin-bottom: -40px;
            filter: drop-shadow(0 -10px 40px rgba(0,0,0,0.9));
            animation: float-env 6s ease-in-out infinite;
            transform-origin: bottom center;
        }

        @keyframes float-env {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
        }

        .vortex-input-bar {
            position: relative;
            z-index: 4;
            width: 100%;
            min-width: 480px;
            height: 64px;
            background: linear-gradient(180deg, #18181A 0%, #08080A 100%);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 4px;
            display: flex;
            align-items: center;
            padding: 0 12px 0 24px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .vortex-input-bar input {
            background: transparent;
            border: none;
            color: #fff;
            font-family: 'Courier New', Courier, monospace;
            font-size: 15px;
            flex-grow: 1;
            outline: none;
            letter-spacing: -0.02em;
        }

        .vortex-input-bar input::placeholder {
            color: #777;
        }

        .vortex-input-bar button {
            background: transparent;
            border: none;
            color: #71717A;
            font-family: 'Courier New', Courier, monospace;
            font-size: 15px;
            cursor: pointer;
            transition: color 0.3s;
            white-space: nowrap;
            padding: 8px 12px;
        }

        .vortex-input-bar button:hover {
            color: #fff;
        }

        /* 12. Checkout Modal Refinements */`;

const regexHTML = /<section class="section text-center cta-section" id="waitlist"[\s\S]*?<\/section>/;
const newHTML = `<section class="vortex-section" id="waitlist">
            <div class="vortex-glow"></div>
            <div class="vortex-grid-wrapper">
                <svg class="vortex-grid-svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice">
                    <g stroke="rgba(255,255,255,0.8)" stroke-width="1.2" fill="none">
                        <!-- Horizontal depth curves -->
                        <path d="M 0 350 Q 500 450 1000 350" />
                        <path d="M 0 280 Q 500 380 1000 280" opacity="0.8"/>
                        <path d="M 0 220 Q 500 320 1000 220" opacity="0.6"/>
                        <path d="M 0 170 Q 500 270 1000 170" opacity="0.5"/>
                        <path d="M 0 130 Q 500 220 1000 130" opacity="0.4"/>
                        <path d="M 0 100 Q 500 180 1000 100" opacity="0.3"/>
                        <path d="M 0 70 Q 500 150 1000 70" opacity="0.2"/>
                        
                        <!-- Funneling verticals -->
                        <path d="M -200 500 L 500 50" opacity="0.8"/>
                        <path d="M 0 500 L 500 50" opacity="0.8"/>
                        <path d="M 200 500 L 500 50" opacity="0.8"/>
                        <path d="M 350 500 L 500 50" opacity="0.8"/>
                        <path d="M 450 500 L 500 50" opacity="0.8"/>
                        <path d="M 500 500 L 500 50" opacity="1.0"/>
                        <path d="M 550 500 L 500 50" />
                        <path d="M 650 500 L 500 50" />
                        <path d="M 800 500 L 500 50" />
                        <path d="M 1000 500 L 500 50" />
                        <path d="M 1200 500 L 500 50" />
                    </g>
                </svg>
            </div>

            <div class="vortex-content container">
                <div class="vortex-envelope-wrapper">
                    <!-- 3D Metallic Envelope -->
                    <svg width="340" height="200" viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" class="envelope-svg">
                        <defs>
                            <linearGradient id="envTopFlap" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#b0b0b0"/>
                                <stop offset="100%" stop-color="#707070"/>
                            </linearGradient>
                            <linearGradient id="envBotFlap" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stop-color="#9a9a9a"/>
                                <stop offset="100%" stop-color="#555555"/>
                            </linearGradient>
                            <linearGradient id="envInside" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#2a2a2a"/>
                                <stop offset="100%" stop-color="#111111"/>
                            </linearGradient>
                        </defs>
                        
                        <!-- Envelope body inside -->
                        <rect x="0" y="0" width="340" height="200" fill="url(#envInside)" rx="4"/>

                        <!-- Envelope bottom/side flap covering face -->
                        <path d="M0,0 L170,120 L340,0 L340,200 L0,200 Z" fill="url(#envBotFlap)"/>
                        
                        <!-- Cut lines mapping inside folds -->
                        <path d="M0,200 L170,120 L340,200" fill="none" stroke="#4a4a4a" stroke-width="1.5"/>

                        <!-- Top Flap -->
                        <path d="M0,0 L170,130 L340,0 Z" fill="url(#envTopFlap)"/>
                        
                        <!-- Top flap specular highlight -->
                        <path d="M0,0 L170,130 L340,0" fill="none" stroke="#ececec" stroke-width="2" opacity="0.6"/>
                        
                        <!-- Wax Seal Base -->
                        <circle cx="260" cy="95" r="28" fill="#18181A" stroke="#333" stroke-width="2" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));"/>
                        <!-- Seal Inner Ring -->
                        <circle cx="260" cy="95" r="20" fill="none" stroke="#888" stroke-width="1" />
                        <!-- Seal Text -->
                        <text x="260" y="103" font-family="'Courier New', Courier, monospace" font-size="24" fill="#fff" text-anchor="middle" font-weight="700">0</text>
                    </svg>
                </div>

                <div class="vortex-input-bar">
                    <input type="email" placeholder="Enter your email" />
                    <button>Join waitlist</button>
                </div>
            </div>
        </section>`;

let replaced = false;
if (content.match(regexCSS)) {
    content = content.replace(regexCSS, newCSS);
    replaced = true;
} else {
    console.error("CSS block not found");
}

if (content.match(regexHTML)) {
    content = content.replace(regexHTML, newHTML);
} else {
    console.error("HTML block not found");
    replaced = false;
}

if (replaced) {
    fs.writeFileSync(file, content);
    console.log("SUCCESS");
}
