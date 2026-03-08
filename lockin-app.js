/**
 * LockIn App Logic (Ultra-Premium SaaS Architecture + Serverless Firebase)
 * Contains the logic for the live animated grid background, magnetic buttons, and glassmorphism scroll events.
 */

/* ─── FIREBASE INITIALIZATION ─────────────────────────────────────────────────────── */
// User provided only the apiKey, so we construct a best-effort config for the project
const firebaseConfig = {
    apiKey: "AIzaSyBc55ak1_xaN-qWSMF4NHQJdhuLZawMQm8",
    authDomain: "lockin-5e7f6.firebaseapp.com",
    projectId: "lockin-5e7f6",
    storageBucket: "lockin-5e7f6.firebasestorage.app",
    messagingSenderId: "112501900352",
    appId: "1:112501900352:web:5025685f41712c1353cba5",
    measurementId: "G-1YP5N1H2E7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ─── AUTH MODULE (Firebase Adapter) ──────────────────────────────────────────────── */
const Auth = {
    getToken: async () => {
        const user = auth.currentUser;
        return user ? await user.getIdToken() : null;
    },
    getUser: () => {
        const user = auth.currentUser;
        return user ? { username: user.displayName || user.email.split('@')[0], email: user.email, uid: user.uid } : null;
    },
    isLoggedIn: () => !!auth.currentUser,
    clear: async () => await auth.signOut()
};

// Keep authFetch for backward compatibility with other API calls if needed (like Razorpay)
async function authFetch(url, options = {}) {
    const token = await Auth.getToken();
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

// Listen for auth state changes immediately to update UI
auth.onAuthStateChanged((user) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (typeof updateNavAuth === 'function') updateNavAuth();
    }
});

document.addEventListener('DOMContentLoaded', () => {

    /* ── MORPHING PRELOADER LOGIC ───────────────────────────── */
    const preloader = document.getElementById('morph-preloader');
    if (preloader) {
        // The CSS animation sequence takes exactly 2.8s. 
        // We'll hold it for 2.8s, then fade out, then remove from DOM.
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.remove();
            }, 800); // Wait for the transition: opacity 0.8s to finish
        }, 2800);
    }

    /* ── SCROLL & NAVIGATION MANAGEMENT ────────────────────────────── */
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            if (!targetId) return;

            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 84;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ── NAVBAR PILL LOGIC (Animated Indicator) ───────────────────── */
    const navLinksContainer = document.querySelector('.nav-links');
    const navPill = document.getElementById('nav-active-pill');
    const sections = Array.from(document.querySelectorAll('section, main > div[id], header[id="hero"]')).filter(el => el.id);
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

    if (navLinksContainer && navPill && navAnchors.length > 0) {

        // Function to move the pill to a specific anchor target
        function movePillTo(anchor) {
            const containerRect = navLinksContainer.getBoundingClientRect();
            const anchorRect = anchor.getBoundingClientRect();

            navPill.style.width = `${anchorRect.width}px`;
            // Calculate relative offset from the container's left edge
            const offsetLeft = anchorRect.left - containerRect.left;
            navPill.style.transform = `translateY(-50%) translateX(${offsetLeft}px)`;
            navPill.style.opacity = '1';
        }

        let activeScrollAnchor = null;

        // Intersection Observer to detect which section is in view
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -60% 0px', // Trigger when section passes middle of screen
            threshold: 0
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    const matchingAnchor = Array.from(navAnchors).find(a => a.getAttribute('href') === `#${sectionId}`);
                    // Fallback heuristics: If in hero, hide it or point to first element if applicable (we hide it at top)

                    if (matchingAnchor) {
                        activeScrollAnchor = matchingAnchor;
                        movePillTo(matchingAnchor);
                    } else if (window.scrollY < 100) {
                        activeScrollAnchor = null;
                        navPill.style.opacity = '0';
                    }
                }
            });
        }, observerOptions);

        sections.forEach(sec => sectionObserver.observe(sec));

        // Let mouse hover override the current scroll position preview
        navAnchors.forEach(a => {
            a.addEventListener('mouseenter', () => {
                movePillTo(a);
            });
        });

        // When mouse leaves nav, snap back to scroll position tracking
        navLinksContainer.addEventListener('mouseleave', () => {
            if (activeScrollAnchor && window.scrollY > 100) {
                movePillTo(activeScrollAnchor);
            } else {
                navPill.style.opacity = '0';
            }
        });

        // Init check on load
        setTimeout(() => {
            if (window.scrollY < 100) navPill.style.opacity = '0';
        }, 300);

        // Update on resize in case link widths change
        window.addEventListener('resize', () => {
            if (activeScrollAnchor && window.scrollY > 100) movePillTo(activeScrollAnchor);
        });
    }

    /* ── MOBILE NAV OVERLAY ────────────────────────────────────────── */
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    if (mobileBtn && mobileNav) {
        function toggleMenu() {
            const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
            mobileBtn.setAttribute('aria-expanded', !isExpanded);
            mobileNav.classList.toggle('active');
            document.body.style.overflow = isExpanded ? '' : 'hidden'; // Lock body scroll
        }

        mobileBtn.addEventListener('click', toggleMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });

        // Close on escape for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    /* ── WAITLIST FORM (Netlify Native) ────────────────────────────── */
    const waitlistForm = document.getElementById('waitlist-form');
    const waitlistEmail = document.getElementById('waitlist-email');
    const waitlistBtn = waitlistForm ? waitlistForm.querySelector('button') : null;
    const waitlistMsg = document.getElementById('waitlist-message');

    if (waitlistForm && waitlistBtn && waitlistEmail && waitlistMsg) {
        const submitted = new URLSearchParams(window.location.search).get('submitted') === 'true';
        if (submitted) {
            waitlistBtn.textContent = 'Beta Secured';
            waitlistBtn.disabled = true;
            waitlistMsg.textContent = "✓ You're on the list! We'll notify you when LockIn launches.";
            waitlistMsg.className = 'form-message success';
            waitlistEmail.value = '';
            waitlistEmail.style.borderColor = 'var(--color-success)';
            waitlistEmail.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)';
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
    }

    /* ── HIGH PERFORMANCE SCROLL REVEALS ───────────────────────────── */
    const revealElements = document.querySelectorAll('.glass-card, .section-header, .timeline-step, .glass-ui-preview');

    // Setup initial state securely
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    });

    // Stagger reveal observation
    revealElements.forEach((el, index) => {
        setTimeout(() => {
            revealObserver.observe(el);
        }, index * 20); // slight stagger for initial dom load
    });

    /* ── INTERACTIVE SESSION COMMITMENT UI ─────────────────────────── */
    const heroTimer = document.getElementById('hero-timer');
    const initiateBtn = document.getElementById('mock-initiate-btn');
    const glassPreview = document.querySelector('.phone-container.phone-1');

    if (heroTimer && initiateBtn) {
        let currentMinutes = 60;
        let currentSeconds = 0;
        let timerInterval;
        let isSessionLocked = false;

        const updateTimerDisplay = () => {
            heroTimer.textContent = `${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
        };

        const startTimer = () => {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (currentSeconds === 0) {
                    if (currentMinutes === 0) {
                        currentMinutes = 60;
                    } else {
                        currentMinutes--;
                        currentSeconds = 59;
                    }
                } else {
                    currentSeconds--;
                }
                updateTimerDisplay();
            }, 1000);
        };

        const stopTimer = () => {
            clearInterval(timerInterval);
        };

        const resetTimer = () => {
            currentMinutes = 60;
            currentSeconds = 0;
            updateTimerDisplay();
        };

        // Init
        updateTimerDisplay();

        const bodyOverlay = document.createElement('div');
        bodyOverlay.style.position = 'fixed';
        bodyOverlay.style.inset = '0';
        bodyOverlay.style.pointerEvents = 'none';
        bodyOverlay.style.transition = 'background 0.5s ease';
        bodyOverlay.style.zIndex = '1';
        document.body.prepend(bodyOverlay);

        initiateBtn.addEventListener('click', () => {
            if (isSessionLocked) {
                // CANCEL SESSION Flow
                isSessionLocked = false;
                stopTimer();
                resetTimer();

                initiateBtn.innerHTML = 'Initiate Lock-In';
                initiateBtn.style.background = '';
                initiateBtn.style.color = '';
                initiateBtn.style.borderColor = '';
                initiateBtn.style.boxShadow = '';

                if (glassPreview) {
                    glassPreview.style.boxShadow = '';
                }
                bodyOverlay.style.background = '';
                heroTimer.classList.remove('pulse-danger');
                return;
            }

            // START SESSION Flow
            isSessionLocked = true;
            startTimer();

            initiateBtn.textContent = 'Cancel Session X';
            initiateBtn.style.background = 'rgba(255, 77, 79, 0.1)';
            initiateBtn.style.color = 'var(--color-danger)';
            initiateBtn.style.borderColor = 'rgba(255, 77, 79, 0.5)';
            initiateBtn.style.boxShadow = 'none';

            // Highlight anxiety state
            if (glassPreview) {
                glassPreview.style.boxShadow = '0 24px 80px rgba(0, 0, 0, 0.9), 0 0 120px rgba(255, 77, 79, 0.3)';
            }
            bodyOverlay.style.background = 'radial-gradient(circle at center, rgba(255, 77, 79, 0.05) 0%, transparent 100vw)';

            initiateBtn.classList.add('pulse-danger');
            setTimeout(() => {
                initiateBtn.classList.remove('pulse-danger');
            }, 800);

            heroTimer.classList.remove('pulse-danger');
            void heroTimer.offsetWidth;
            heroTimer.classList.add('pulse-danger');
        });
    }

    /* ── MAGNETIC BUTTONS (HOVER INTERACTION) ───────────────────────── */
    const magneticBtns = document.querySelectorAll('.btn-magnetic');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            // Calculate mouse position relative to center of button
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Subtle 3D magnetic pull effect
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.02)`;
        });

        btn.addEventListener('mouseleave', () => {
            // Reset position on mouse leave
            btn.style.transform = 'translate(0px, 0px) scale(1)';
        });
    });

    /* ── LIVE ANIMATED GRID BACKGROUND (CANVAS) ─────────────────────── */
    const canvas = document.getElementById('grid-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('Canvas 2D context not available');
        } else {
            let width, height;
            let mouseX = -1000, mouseY = -1000;
            let time = 0;

            // Resize function
            function resize() {
                width = canvas.width = window.innerWidth;
                height = canvas.height = document.querySelector('.hero').offsetHeight;
            }

            window.addEventListener('resize', resize);
            resize();

            // Track mouse position over canvas
            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                // Adjust for scroll offset
                mouseY = e.clientY + window.scrollY;
            });

            // Grid config
            const gridSpacing = 48;
            let isVisible = true;

            // GPU Optimization: Cache theme attribute instead of querying DOM at 60fps
            let isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const themeObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'data-theme') {
                        isLight = document.documentElement.getAttribute('data-theme') === 'light';
                    }
                });
            });
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

            // GPU Optimization: Pause Canvas rendering when Hero leaves viewport
            const canvasObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const wasVisible = isVisible;
                    isVisible = entry.isIntersecting;

                    // If it just became visible again, instantly restart the loop
                    if (isVisible && !wasVisible) {
                        animate();
                    }
                });
            }, { threshold: 0 });

            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                canvasObserver.observe(heroSection);
            }

            function animate() {
                // HALT RENDER CYCLE IF OFF-SCREEN
                if (!isVisible) return;

                ctx.clearRect(0, 0, width, height);

                // Setup Mask Gradient for cursor proximity
                const glowRadius = 250;
                const lineGradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, glowRadius);
                lineGradient.addColorStop(0, isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)');
                lineGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                // 1. Draw Grid Base with constrained gradient stroke
                ctx.beginPath();
                ctx.strokeStyle = lineGradient;
                ctx.lineWidth = 1;

                // Draw vertical lines
                for (let x = 0; x <= width; x += gridSpacing) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                }

                // Draw horizontal lines
                for (let y = 0; y <= height; y += gridSpacing) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();

                // 3. Add Subtle Scrolling/Pulsing Lines overlay for "live" feel
                if (!isLight) {
                    time += 0.005;
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(139, 124, 255, 0.08)'; // Secondary accent
                    ctx.lineWidth = 1.5;

                    // Animate some horizontal lines moving downward
                    for (let i = 0; i < 5; i++) {
                        let movingY = ((time * 100) + (i * height / 5)) % height;
                        ctx.moveTo(0, movingY);
                        ctx.lineTo(width, movingY);
                    }
                    ctx.stroke();
                }

                // Loop animation
                requestAnimationFrame(animate);
            }

            // Start animation loop
            animate();
        }
    }

    /* ── PAYMENT & AD FLOW ───────────────────────────────────────────── */
    const checkoutModal = document.getElementById('checkout-modal');
    const adModal = document.getElementById('ad-modal');

    function openModal(el) { if (!el) return; el.classList.add('active'); el.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
    function closeModal(el) { if (!el) return; el.classList.remove('active'); el.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

    // ── Watch Ad button ──
    const btnWatchAd = document.getElementById('btn-watch-ad');
    if (btnWatchAd) {
        btnWatchAd.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(adModal);
            startAdCountdown();
        });
    }

    // ── Stake Mode button (beta: redirect to waitlist) ──
    const btnStakeOpen = document.getElementById('btn-stake-open');
    if (btnStakeOpen) {
        btnStakeOpen.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ── Razorpay helper ──
    async function openRazorpay(planId, amountInr, onSuccess) {
        // 1. Get key
        const keyRes = await fetch('/api/razorpay-key');
        const { key } = await keyRes.json();
        if (!key) throw new Error('Razorpay key not available');

        // 2. Create order
        const orderRes = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, stakeAmountInr: amountInr }),
        });
        if (!orderRes.ok) throw new Error('Failed to create order.');
        const orderData = await orderRes.json();
        if (!orderData.orderId) throw new Error(orderData.error || 'Failed to create order.');

        // 3. Open Razorpay checkout popup
        return new Promise((resolve, reject) => {
            const options = {
                key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'LockIn',
                description: planId === 'stake' ? `Accountability Stake — ₹${amountInr}` : 'LockIn Pro — Monthly',
                order_id: orderData.orderId,
                handler: async function (response) {
                    // 4. Verify on server
                    try {
                        const v = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(response),
                        });
                        const vd = await v.json();
                        if (vd.ok) {
                            if (onSuccess) onSuccess();
                            resolve(true);
                        } else {
                            reject(new Error(vd.error || 'Verification failed.'));
                        }
                    } catch (err) {
                        reject(err);
                    }
                },
                prefill: {},
                theme: { color: '#09090b' },
                modal: {
                    ondismiss: () => resolve(false),
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        });
    }

    // ── Pro button (beta: redirect to waitlist) ──
    const btnProOpen = document.getElementById('btn-pro-open');
    if (btnProOpen) {
        btnProOpen.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ── Close buttons ──
    document.getElementById('close-checkout')?.addEventListener('click', () => closeModal(checkoutModal));
    document.getElementById('close-ad-modal')?.addEventListener('click', () => { closeModal(adModal); clearAdCountdown(); });
    checkoutModal?.addEventListener('click', (e) => { if (e.target === checkoutModal) closeModal(checkoutModal); });
    adModal?.addEventListener('click', (e) => { if (e.target === adModal) { closeModal(adModal); clearAdCountdown(); } });

    // ── Stake amount chips ──
    // ── Cache DOM nodes for keystroke performance ──
    const stakeInp = document.getElementById('stake-amount-input');
    const stakeCt = document.getElementById('contract-input');
    const stakeErr = document.getElementById('stake-error');
    const stakePayBtn = document.getElementById('btn-submit-pay');
    const stakePayText = document.getElementById('pay-text');
    const stakePaySpinner = document.getElementById('pay-spinner');

    document.querySelectorAll('.stake-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (stakeInp) stakeInp.value = chip.dataset.val;
            document.querySelectorAll('.stake-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            validateStake();
        });
    });

    stakeInp?.addEventListener('input', () => {
        document.querySelectorAll('.stake-chip').forEach(c => c.classList.remove('active'));
        validateStake();
    });

    stakeCt?.addEventListener('input', () => validateStake());

    function validateStake() {
        const amount = parseInt(stakeInp?.value, 10);
        const contracted = stakeCt?.value === 'I ACCEPT THE RISK';

        if (stakeInp?.value && (isNaN(amount) || amount < 50)) {
            if (stakeErr) stakeErr.textContent = 'Minimum stake is ₹50.';
        } else {
            if (stakeErr) stakeErr.textContent = '';
        }

        const valid = amount >= 50 && contracted;
        if (stakePayBtn && stakePayText) {
            stakePayBtn.style.background = valid ? 'var(--color-danger)' : '#ffffff';
            stakePayBtn.style.color = valid ? '#fff' : '#000';
            if (stakePayText) stakePayText.textContent = valid ? `Stake ₹${amount} — Proceed` : 'Proceed to Payment';
        }
    }

    function resetPayBtn() {
        if (stakePayBtn) { stakePayBtn.style.background = '#ffffff'; stakePayBtn.style.color = '#000'; stakePayBtn.style.pointerEvents = 'auto'; stakePayBtn.style.opacity = '1'; }
        if (stakePayText) stakePayText.textContent = 'Proceed to Payment';
    }

    // ── Stake pay submit ──
    stakePayBtn?.addEventListener('click', async () => {
        const amount = parseInt(stakeInp?.value, 10);

        if (!amount || amount < 50) {
            if (stakeErr) stakeErr.textContent = 'Minimum stake is ₹50.';
            if (stakeInp) stakeInp.focus();
            return;
        }
        if (stakeCt?.value !== 'I ACCEPT THE RISK') {
            if (stakeCt) stakeCt.focus();
            if (stakePayBtn) {
                stakePayBtn.classList.remove('vibrate');
                void stakePayBtn.offsetWidth;
                stakePayBtn.classList.add('vibrate');
                setTimeout(() => stakePayBtn.classList.remove('vibrate'), 400);
            }
            return;
        }

        if (stakePayText) stakePayText.textContent = 'Processing…';
        if (stakePaySpinner) stakePaySpinner.style.display = '';
        if (stakePayBtn) { stakePayBtn.style.pointerEvents = 'none'; stakePayBtn.style.opacity = '0.75'; }

        try {
            const paid = await openRazorpay('stake', amount, () => {
                // Close the checkout modal on success
                const checkoutModal = document.getElementById('checkout-modal');
                if (checkoutModal) { checkoutModal.classList.remove('active'); checkoutModal.setAttribute('aria-hidden', 'true'); }
            });
            if (paid) {
                window.location.href = `/?payment=success&plan=stake&amount=${amount}`;
            } else {
                resetPayBtn(); if (stakePaySpinner) stakePaySpinner.style.display = 'none';
            }
        } catch (err) {
            if (err && err instanceof Error) {
                if (err) err.textContent = err.message || 'Payment failed.';
            } else if (err && typeof err === 'object' && 'message' in err) {
                if (err) err.textContent = err.message;
            } else if (err) {
                if (err && document.getElementById('stake-error')) document.getElementById('stake-error').textContent = 'Payment failed.'; // Fallback since err textContent is not valid on an Error string
            }
            resetPayBtn(); if (stakePaySpinner) stakePaySpinner.style.display = 'none';
        }
    });

    // ── Ad countdown ──
    let _adTimer = null;
    function startAdCountdown() {
        let secs = 30;
        const countEl = document.getElementById('ad-countdown');
        const progressEl = document.getElementById('ad-progress-bar');
        const continueBtn = document.getElementById('btn-ad-continue');
        const btnText = document.getElementById('ad-btn-text');
        if (!countEl) return;

        clearInterval(_adTimer);
        _adTimer = setInterval(() => {
            secs--;
            if (countEl) countEl.textContent = secs;
            if (progressEl) progressEl.style.width = `${((30 - secs) / 30) * 100}%`;
            if (secs <= 0) {
                clearInterval(_adTimer);
                if (continueBtn) {
                    continueBtn.disabled = false;
                    continueBtn.style.cssText = 'background:#fff;color:#000;border:none;cursor:pointer';
                    if (btnText) btnText.textContent = 'Continue to Free Session';
                }
            }
        }, 1000);
    }
    function clearAdCountdown() {
        clearInterval(_adTimer);
        const countEl = document.getElementById('ad-countdown');
        const progressEl = document.getElementById('ad-progress-bar');
        const continueBtn = document.getElementById('btn-ad-continue');
        const btnText = document.getElementById('ad-btn-text');
        if (countEl) countEl.textContent = '30';
        if (progressEl) progressEl.style.width = '0%';
        if (continueBtn) { continueBtn.disabled = true; continueBtn.style.cssText = 'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);border:1px solid var(--glass-border);cursor:not-allowed'; }
        if (btnText) btnText.textContent = 'Continue in 30s…';
    }
    document.getElementById('btn-ad-continue')?.addEventListener('click', () => {
        closeModal(adModal);
        clearAdCountdown();
        // TODO: unlock session here
        alert('Session unlocked! 🎉');
    });

    // ── Payment success/cancel banner ──
    (() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('payment');
        if (!status) return;
        const msg = status === 'success'
            ? `✓ Payment confirmed${params.get('plan') === 'stake' ? ` — ₹${params.get('amount')} staked` : ''}. Your session is locked in.`
            : '✗ Payment cancelled. No charge was made.';
        const banner = Object.assign(document.createElement('div'), { textContent: msg });
        Object.assign(banner.style, {
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: status === 'success' ? '#16a34a' : '#dc2626',
            color: '#fff', padding: '12px 24px', borderRadius: '10px',
            fontWeight: '600', fontSize: '14px', zIndex: '9999',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
        });
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 6000);
        history.replaceState({}, '', location.pathname);
    })();

    /* ── LIVE ANALYTICS DASHBOARD ────────────────────────────────── */
    const focusScoreElement = document.getElementById('focusScore');
    const focusScoreCircle = document.getElementById('focusScoreCircle');
    const weeklyHoursElement = document.getElementById('weeklyHours');
    const weeklyChangeElement = document.getElementById('weeklyChange');
    const todayHoursElement = document.getElementById('todayHours');
    const activeSessionsElement = document.getElementById('activeSessions');
    const disciplineRateElement = document.getElementById('disciplineRate');
    const productivityElement = document.getElementById('productivity');

    if (focusScoreElement && focusScoreCircle) {
        // Initial values
        let currentFocusScore = 90;
        let currentWeeklyHours = 32.4;
        let currentTodayHours = 4.2;
        let currentActiveSessions = 3;
        let currentDiscipline = 98.5;
        let currentProductivity = 8.2;

        // Update focus score circle progress (circumference = 264, so dashoffset = 264 - (264 * score/100))
        function updateFocusScoreCircle(score) {
            const circumference = 264;
            const offset = circumference - (circumference * score / 100);
            focusScoreCircle.style.strokeDashoffset = offset;
        }

        // Animate number changes
        function animateNumber(element, start, end, suffix = '', duration = 800) {
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeOutQuad = progress * (2 - progress);
                const current = start + (end - start) * easeOutQuad;

                if (suffix === 'h') {
                    element.innerHTML = current.toFixed(1) + '<span style="font-size: var(--text-base); color: var(--color-text-dim); font-weight: 500;">h</span>';
                } else if (suffix === '%') {
                    element.textContent = current.toFixed(1) + '%';
                } else {
                    element.textContent = Math.round(current) + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
        }

        // Live update function - fetch real stats from Firebase
        let unsubscribeAnalytics = null;

        function attachAnalyticsListener(user) {
            if (unsubscribeAnalytics) unsubscribeAnalytics(); // clear old listener

            if (!user) {
                // If logged out, show 0s or defaults
                animateNumber(focusScoreElement, currentFocusScore, 0, '', 600);
                updateFocusScoreCircle(0);
                animateNumber(weeklyHoursElement, currentWeeklyHours, 0, 'h', 800);
                if (productivityElement) productivityElement.innerHTML = `― 0%`;
                return;
            }

            // Listen to real user document in Firestore
            unsubscribeAnalytics = db.collection('users').doc(user.uid).onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();

                    const newFocusScore = data.focusScore || 0;
                    const newWeeklyHours = data.weeklyHours || 0;
                    const newProductivity = data.flowScore || 0;
                    const newTotalLocked = data.totalLocked || 0;
                    const newProtectionRate = data.protectionRate || 100;

                    // Animate updates
                    animateNumber(focusScoreElement, currentFocusScore, newFocusScore, '', 600);
                    updateFocusScoreCircle(newFocusScore);
                    animateNumber(weeklyHoursElement, currentWeeklyHours, newWeeklyHours, 'h', 800);

                    if (productivityElement) {
                        const arrow = newProductivity > currentProductivity ? '▲' : newProductivity < currentProductivity ? '▼' : '―';
                        productivityElement.innerHTML = `${arrow} ${newProductivity.toFixed(1)}%`;
                        productivityElement.style.color = newProductivity > 5 ? 'var(--color-success)' : 'var(--color-warning)';
                    }

                    // Update external showcase elements if they exist
                    const totalLockedEl = document.getElementById('total-locked');
                    if (totalLockedEl) totalLockedEl.textContent = `$${newTotalLocked.toLocaleString()}`;

                    const protectionRateEl = document.getElementById('protection-rate');
                    if (protectionRateEl) protectionRateEl.textContent = `${newProtectionRate}%`;

                    // Store current values for next animation
                    currentFocusScore = newFocusScore;
                    currentWeeklyHours = newWeeklyHours;
                    currentProductivity = newProductivity;
                }
            }, (error) => {
                console.error("Error fetching analytics:", error);
            });
        }

        // Listen for auth changes to attach the DB listener to the correct user
        auth.onAuthStateChanged((user) => {
            attachAnalyticsListener(user);
        });

        // Initialize the circle animation
        updateFocusScoreCircle(currentFocusScore);

        // Update analytics every 3 seconds
        setInterval(updateAnalytics, 3000);

        // Also update on visibility change (when tab becomes active)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                updateAnalytics();
            }
        });
    }

    /* ── ADDITIONAL ANALYTICS: Peak Performance, Sessions, Momentum ── */
    const morningBar = document.getElementById('morningBar');
    const afternoonBar = document.getElementById('afternoonBar');
    const eveningBar = document.getElementById('eveningBar');
    const sessionsCompleted = document.getElementById('sessionsCompleted');
    const successRate = document.getElementById('successRate');
    const nextSession = document.getElementById('nextSession');
    const momentumScore = document.getElementById('momentumScore');
    const momentumCircle = document.getElementById('momentumCircle');
    const momentumStatus = document.getElementById('momentumStatus');

    if (momentumScore && momentumCircle) {
        let currentMorning = 75;
        let currentAfternoon = 92;
        let currentEvening = 58;
        let currentSessions = 7;
        let currentSuccess = 100;
        let currentMomentum = 70;
        let nextSessionMinutes = 23;

        // Update momentum circle (circumference = 314, so dashoffset = 314 - (314 * score/100))
        function updateMomentumCircle(score) {
            const circumference = 314;
            const offset = circumference - (circumference * score / 100);
            momentumCircle.style.strokeDashoffset = offset;
        }

        // Additional Analytics logic merged into the main attachAnalyticsListener above
        // We just keep the circle initialization here to run once on load
        if (typeof currentMomentum !== 'undefined') {
            updateMomentumCircle(currentMomentum);
        }
    }

    /* ── LIVE LEADERBOARD RANK MOVEMENTS ─────────────────────────── */
    const rankMovementElements = document.querySelectorAll('.rank-movement');

    if (rankMovementElements.length > 0) {
        // Store previous positions for each rank
        const rankStates = [
            { rank: 1, movement: 0, direction: 'neutral' },
            { rank: 2, movement: 2, direction: 'up' },
            { rank: 3, movement: -1, direction: 'down' }
        ];

        function updateRankMovement(element, index) {
            const state = rankStates[index];

            // Generate realistic rank changes
            const changeChance = Math.random();

            // 40% chance of rank change
            if (changeChance < 0.4) {
                // Determine if up or down (slightly weighted towards maintaining position)
                const upOrDown = Math.random();
                let newMovement;

                if (upOrDown < 0.35) {
                    // Move up (1-3 positions)
                    newMovement = Math.floor(Math.random() * 3) + 1;
                    state.direction = 'up';
                } else if (upOrDown < 0.7) {
                    // Move down (1-2 positions)
                    newMovement = -(Math.floor(Math.random() * 2) + 1);
                    state.direction = 'down';
                } else {
                    // No change
                    newMovement = 0;
                    state.direction = 'neutral';
                }

                state.movement = newMovement;

                // Update the element
                const icon = element.querySelector('.rank-movement-icon');
                const text = element.querySelector('span:last-child');

                // Add animation class
                element.classList.add('animating');
                setTimeout(() => element.classList.remove('animating'), 400);

                // Remove old classes
                element.classList.remove('up', 'down', 'neutral');

                if (state.direction === 'up') {
                    element.classList.add('up');
                    icon.textContent = '↑';
                    text.textContent = `+${Math.abs(state.movement)}`;
                } else if (state.direction === 'down') {
                    element.classList.add('down');
                    icon.textContent = '↓';
                    text.textContent = `-${Math.abs(state.movement)}`;
                } else {
                    element.classList.add('neutral');
                    icon.textContent = '—';
                    text.textContent = '0';
                }
            }
        }

        function updateAllRankMovements() {
            rankMovementElements.forEach((element, index) => {
                // Stagger updates slightly for more realistic feel
                setTimeout(() => {
                    updateRankMovement(element, index);
                }, index * 500);
            });
        }

        // Initial update after 2 seconds
        setTimeout(updateAllRankMovements, 2000);

        // Update rank movements every 8-12 seconds
        setInterval(() => {
            updateAllRankMovements();
        }, 8000 + Math.random() * 4000);

        // Also update when returning to the page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateAllRankMovements, 1000);
            }
        });
    }

    /* ── LIVE DATA ANIMATIONS FOR SHOWCASE CARDS ───────────────────── */
    // Make stats feel real-time with subtle updates

    // Weekly Hours counter animation
    const weeklyHoursEl = document.getElementById('weekly-hours');
    if (weeklyHoursEl) {
        let currentHours = 32.4;
        setInterval(() => {
            // Randomly increase by 0.1 or 0.2 hours
            const increase = Math.random() > 0.5 ? 0.1 : 0.2;
            currentHours += increase;
            weeklyHoursEl.textContent = `${currentHours.toFixed(1)} hours`;

            // Add brief pulse animation
            weeklyHoursEl.style.transform = 'scale(1.05)';
            setTimeout(() => {
                weeklyHoursEl.style.transform = 'scale(1)';
            }, 200);
        }, 12000 + Math.random() * 8000); // Every 12-20 seconds
    }

    // Streak counter animation
    const streakDaysEl = document.getElementById('streak-days');
    const streakRankEl = document.getElementById('streak-rank');
    if (streakDaysEl && streakRankEl) {
        let currentRank = 47;
        setInterval(() => {
            // Occasionally improve rank
            if (Math.random() > 0.6) {
                currentRank = Math.max(1, currentRank - 1);
                streakRankEl.textContent = `#${currentRank}`;

                // Pulse effect
                streakRankEl.style.transform = 'scale(1.08)';
                streakRankEl.style.color = '#fbbf24';
                setTimeout(() => {
                    streakRankEl.style.transform = 'scale(1)';
                    streakRankEl.style.color = '#f59e0b';
                }, 300);
            }
        }, 15000 + Math.random() * 10000); // Every 15-25 seconds
    }

    // Focus Score pulse animation
    const focusScoreEl = document.getElementById('focus-score');
    if (focusScoreEl) {
        let currentScore = 90;
        setInterval(() => {
            // Slight fluctuation ±1
            const change = Math.random() > 0.5 ? 1 : -1;
            currentScore = Math.max(88, Math.min(92, currentScore + change));
            focusScoreEl.textContent = currentScore;

            // Subtle pulse
            focusScoreEl.style.transform = 'scale(1.03)';
            setTimeout(() => {
                focusScoreEl.style.transform = 'scale(1)';
            }, 200);
        }, 8000 + Math.random() * 7000); // Every 8-15 seconds
    }

    // Flow Score animation
    const flowScoreEl = document.getElementById('flow-score');
    if (flowScoreEl) {
        let currentFlow = 68;
        setInterval(() => {
            // Slowly increase
            if (Math.random() > 0.4) {
                currentFlow = Math.min(75, currentFlow + 1);
                flowScoreEl.textContent = currentFlow;

                // Pulse
                flowScoreEl.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    flowScoreEl.style.transform = 'scale(1)';
                }, 250);
            }
        }, 10000 + Math.random() * 8000); // Every 10-18 seconds
    }

    // Money at Stake animation
    const stakeAmountEl = document.getElementById('stake-amount');
    if (stakeAmountEl) {
        const amounts = ['$250', '$175', '$300', '$225', '$280', '$200'];
        let currentIndex = 0;
        setInterval(() => {
            currentIndex = (currentIndex + 1) % amounts.length;
            stakeAmountEl.textContent = amounts[currentIndex];

            // Subtle pulse with color intensity
            stakeAmountEl.style.transform = 'scale(1.04)';
            stakeAmountEl.style.textShadow = '0 0 16px rgba(239, 68, 68, 0.4)';
            setTimeout(() => {
                stakeAmountEl.style.transform = 'scale(1)';
                stakeAmountEl.style.textShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
            }, 300);
        }, 6000 + Math.random() * 4000); // Every 6-10 seconds
    }

    // Total Locked amount animation
    const totalLockedEl = document.getElementById('total-locked');
    if (totalLockedEl) {
        let currentLocked = 12450;
        setInterval(() => {
            // Increase by random amount (50-250)
            currentLocked += Math.floor(Math.random() * 200) + 50;
            totalLockedEl.textContent = `$${currentLocked.toLocaleString()}`;

            // Flash effect
            totalLockedEl.style.opacity = '0.7';
            setTimeout(() => {
                totalLockedEl.style.opacity = '1';
            }, 150);
        }, 18000 + Math.random() * 12000); // Every 18-30 seconds
    }

    // Protection rate animation
    const protectionRateEl = document.getElementById('protection-rate');
    if (protectionRateEl) {
        let rates = [96, 97, 95, 96, 98];
        let rateIndex = 0;
        setInterval(() => {
            rateIndex = (rateIndex + 1) % rates.length;
            protectionRateEl.textContent = `${rates[rateIndex]}%`;

            // Subtle pulse
            protectionRateEl.style.transform = 'scale(1.04)';
            setTimeout(() => {
                protectionRateEl.style.transform = 'scale(1)';
            }, 200);
        }, 20000 + Math.random() * 10000); // Every 20-30 seconds
    }

    // Add smooth transitions to all animated elements
    [weeklyHoursEl, streakDaysEl, streakRankEl, focusScoreEl, flowScoreEl, stakeAmountEl, totalLockedEl, protectionRateEl].forEach(el => {
        if (el) {
            el.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        }
    });

    /* ─── AUTH UI HANDLERS ───────────────────────────────────────────────────── */
    const navSignInBtn = document.getElementById('nav-signin-btn');
    const authModal = document.getElementById('auth-modal');
    const authModalClose = document.getElementById('auth-modal-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const navUserPill = document.getElementById('nav-user-pill');
    const navUsernameDisp = document.getElementById('nav-username-display');
    const navAvatarLetter = document.getElementById('nav-avatar-letter');
    const navLogoutBtn = document.getElementById('nav-logout-btn');

    const authHeading = document.getElementById('auth-heading');
    const authModalCloseX = document.getElementById('auth-modal-close-x');

    const AUTH_HEADINGS = {
        login: 'Welcome back.',
        register: 'Create your account.',
    };

    function switchAuthTab(tab) {
        authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        loginForm?.classList.toggle('active', tab === 'login');
        registerForm?.classList.toggle('active', tab === 'register');
        if (authHeading) authHeading.textContent = AUTH_HEADINGS[tab] || AUTH_HEADINGS.login;
        if (loginError) loginError.textContent = '';
        if (registerError) registerError.textContent = '';
    }

    function openAuthModal(tab = 'login') {
        if (!authModal) return;
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        switchAuthTab(tab);
        renderGoogleButtons();
    }

    function closeAuthModal() {
        if (!authModal) return;
        authModal.classList.remove('active');
        document.body.style.overflow = '';
        if (loginError) loginError.textContent = '';
        if (registerError) registerError.textContent = '';
    }

    function updateNavAuth() {
        const user = Auth.getUser();
        if (user && Auth.isLoggedIn()) {
            if (navSignInBtn) navSignInBtn.style.display = 'none';
            if (navUserPill) {
                navUserPill.style.display = 'flex';
                if (navUsernameDisp) navUsernameDisp.textContent = user.username;
                if (navAvatarLetter) navAvatarLetter.textContent = user.username.charAt(0).toUpperCase();
            }
        } else {
            if (navSignInBtn) navSignInBtn.style.display = 'flex';
            if (navUserPill) navUserPill.style.display = 'none';
        }
    }

    updateNavAuth();

    if (navSignInBtn) navSignInBtn.addEventListener('click', () => openAuthModal('login'));
    if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
    if (authModal) {
        authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && authModal.classList.contains('active')) closeAuthModal(); });
    }

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    /* ── password visibility toggles ── */
    function wirePasswordToggle(toggleId, inputId) {
        const btn = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const isText = input.type === 'text';
            input.type = isText ? 'password' : 'text';
            btn.style.color = isText ? '' : 'rgba(255,255,255,0.65)';
        });
    }
    wirePasswordToggle('login-pw-toggle', 'login-password');
    wirePasswordToggle('register-pw-toggle', 'register-password');

    /* ── Google Sign-In ── */
    function getActiveGoogleErrorElement() {
        return loginForm?.classList.contains('active') ? loginError : registerError;
    }

    function getGoogleAuthErrorMessage(error) {
        const code = error?.code || '';
        if (code === 'auth/popup-blocked') return 'Popup blocked. Please allow popups or try again.';
        if (code === 'auth/popup-closed-by-user') return 'Google sign-in was cancelled.';
        if (code === 'auth/popup-timeout') return 'Google popup timed out. Redirecting to complete sign-in...';
        if (code === 'auth/unauthorized-domain') return 'This domain is not authorized for Google sign-in.';
        if (code === 'auth/operation-not-allowed') return 'Google sign-in is disabled in Firebase Authentication.';
        if (code === 'auth/network-request-failed') return 'Network error. Check your internet connection and retry.';
        return error?.message || 'Google sign-in failed. Please try again.';
    }

    function showGoogleAuthError(error, explicitErrorEl = null) {
        const errEl = explicitErrorEl || getActiveGoogleErrorElement();
        if (!errEl) return;
        errEl.className = 'auth-msg error';
        errEl.textContent = getGoogleAuthErrorMessage(error);
    }

    let googleAuthInFlight = false;
    const GOOGLE_POPUP_TIMEOUT_MS = 12000;

    function setGoogleButtonsBusy(isBusy) {
        ['google-custom-btn-login', 'google-custom-btn-register'].forEach((id) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.disabled = isBusy;
            btn.style.opacity = isBusy ? '0.75' : '';
            btn.style.pointerEvents = isBusy ? 'none' : '';
            btn.style.cursor = isBusy ? 'wait' : '';
        });
    }

    async function syncGoogleUserProfile(result) {
        const user = result?.user;
        if (!user) return;

        const safeEmail = user.email || '';
        const safeUsername = user.displayName || (safeEmail ? safeEmail.split('@')[0] : 'User');
        const profilePayload = {
            username: safeUsername,
            email: safeEmail,
            normalizedEmail: normalizeEmail(safeEmail),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // New users receive default dashboard stats.
        if (result?.additionalUserInfo?.isNewUser) {
            Object.assign(profilePayload, {
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                focusScore: 100,
                flowScore: 0,
                totalLocked: 0,
                weeklyHours: 0,
                protectionRate: 100,
            });
        }

        await db.collection('users').doc(user.uid).set(profilePayload, { merge: true });
    }

    async function finalizeGoogleSignIn(result) {
        try {
            await syncGoogleUserProfile(result);
        } catch (profileError) {
            // Do not block auth success if profile sync fails temporarily.
            console.warn('Google profile sync failed:', profileError);
        }

        googleAuthInFlight = false;
        setGoogleButtonsBusy(false);
        updateNavAuth();
        closeAuthModal();
    }

    async function startGoogleSignIn(explicitErrorEl = null) {
        if (googleAuthInFlight) return;
        googleAuthInFlight = true;
        setGoogleButtonsBusy(true);

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        let triggeredRedirect = false;

        try {
            const popupResult = auth.signInWithPopup(provider);
            const popupTimeout = new Promise((_, reject) => {
                setTimeout(() => reject({ code: 'auth/popup-timeout' }), GOOGLE_POPUP_TIMEOUT_MS);
            });

            const result = await Promise.race([popupResult, popupTimeout]);
            await finalizeGoogleSignIn(result);
            return;
        } catch (error) {
            const useRedirectFallback =
                error?.code === 'auth/popup-blocked' ||
                error?.code === 'auth/operation-not-supported-in-this-environment' ||
                error?.code === 'auth/popup-timeout';
            if (useRedirectFallback) {
                try {
                    triggeredRedirect = true;
                    await auth.signInWithRedirect(provider);
                    return;
                } catch (redirectError) {
                    console.error('Firebase Google Redirect Error:', redirectError);
                    showGoogleAuthError(redirectError, explicitErrorEl);
                    return;
                }
            }

            console.error('Firebase Google Popup Error:', error);
            showGoogleAuthError(error, explicitErrorEl);
        } finally {
            if (!triggeredRedirect) {
                googleAuthInFlight = false;
                setGoogleButtonsBusy(false);
            }
        }
    }

    function wireGoogleButton(customId, errorId) {
        const btn = document.getElementById(customId);
        const errEl = document.getElementById(errorId);
        if (!btn) return;

        btn.style.display = 'flex';
        btn.onclick = async (e) => {
            e.preventDefault();
            if (errEl) {
                errEl.className = 'auth-msg';
                errEl.textContent = '';
            }
            await startGoogleSignIn(errEl);
        };
    }

    function renderGoogleButtons() {
        [['google-btn-login', 'google-custom-btn-login', 'login-error'],
        ['google-btn-register', 'google-custom-btn-register', 'register-error']]
            .forEach(([gisId, customId, errorId]) => {
                const gisContainer = document.getElementById(gisId);
                if (gisContainer) {
                    gisContainer.innerHTML = '';
                    gisContainer.style.display = 'none';
                }
                wireGoogleButton(customId, errorId);
            });
    }
    window._renderGoogleButtons = renderGoogleButtons;
    renderGoogleButtons();

    auth.onAuthStateChanged((user) => {
        updateNavAuth();
        if (user && authModal?.classList.contains('active')) {
            closeAuthModal();
        }
        if (user) {
            googleAuthInFlight = false;
            setGoogleButtonsBusy(false);
        }
    });

    // Helper function to normalize emails to prevent duplicates via aliases or dots
    function normalizeEmail(emailStr) {
        if (!emailStr) return '';
        let e = emailStr.toLowerCase().trim();
        const parts = e.split('@');
        if (parts.length === 2) {
            let local = parts[0];
            let domain = parts[1];
            // Remove + alias
            const plusIndex = local.indexOf('+');
            if (plusIndex !== -1) {
                local = local.substring(0, plusIndex);
            }
            // Remove dots for Google domains
            if (domain === 'gmail.com' || domain === 'googlemail.com') {
                local = local.replace(/\./g, '');
            }
            return `${local}@${domain}`;
        }
        return e;
    }

    auth.getRedirectResult()
        .then(async (result) => {
            if (!result?.user) return;
            if (result?.additionalUserInfo?.providerId && result.additionalUserInfo.providerId !== 'google.com') return;
            await finalizeGoogleSignIn(result);
        })
        .catch((error) => {
            console.error('Firebase Google Redirect Result Error:', error);
            showGoogleAuthError(error);
        });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginVal = document.getElementById('login-input')?.value.trim();
            const passVal = document.getElementById('login-password')?.value;
            const btn = document.getElementById('login-submit-btn');
            if (!loginVal || !passVal) return;
            const btnLabel = btn.querySelector('span:first-child');
            btn.disabled = true; if (btnLabel) btnLabel.textContent = 'Signing in…';
            if (loginError) loginError.className = 'auth-msg';
            if (loginError) loginError.textContent = '';

            try {
                // Firebase Login
                await auth.signInWithEmailAndPassword(loginVal, passVal);
                updateNavAuth();
                closeAuthModal();
            } catch (error) {
                if (loginError) {
                    loginError.className = 'auth-msg error';
                    // Make Firebase errors more user-friendly
                    let msg = error.message;
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        msg = 'Invalid email or password.';
                    }
                    loginError.textContent = msg;
                }
            } finally {
                btn.disabled = false; if (btnLabel) btnLabel.textContent = 'Sign In';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username')?.value.trim();
            const email = document.getElementById('register-email')?.value.trim();
            const password = document.getElementById('register-password')?.value;
            const btn = document.getElementById('register-submit-btn');
            if (!username || !email || !password) return;
            const btnLabel = btn.querySelector('span:first-child');
            btn.disabled = true; if (btnLabel) btnLabel.textContent = 'Creating account…';
            if (registerError) registerError.className = 'auth-msg';
            if (registerError) registerError.textContent = '';

            try {
                // Firebase Registration
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);

                try {
                    const normEmail = normalizeEmail(email);

                    // Check for duplicate normEmail in Firestore
                    const existingUsers = await db.collection('users').where('normalizedEmail', '==', normEmail).get();
                    if (!existingUsers.empty) {
                        const existingDoc = existingUsers.docs[0];
                        if (existingDoc.id !== userCredential.user.uid) {
                            throw new Error("This email (or an alias of it) is already registered.");
                        }
                    }

                    // Strict check against previous documents without normalizedEmail
                    const exactMatches = await db.collection('users').where('email', '==', email).get();
                    if (!exactMatches.empty) {
                        const exactDoc = exactMatches.docs[0];
                        if (exactDoc.id !== userCredential.user.uid) {
                            throw new Error("This exact email is already registered.");
                        }
                    }

                    // Update Firebase display name with username
                    await userCredential.user.updateProfile({
                        displayName: username
                    });

                    // Initialize default user data in Firestore
                    await db.collection('users').doc(userCredential.user.uid).set({
                        username: username,
                        email: email,
                        normalizedEmail: normEmail,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        focusScore: 100,
                        flowScore: 0,
                        totalLocked: 0,
                        weeklyHours: 0,
                        protectionRate: 100
                    });

                } catch (checkError) {
                    await userCredential.user.delete();
                    throw checkError;
                }

                updateNavAuth();
                closeAuthModal();
            } catch (error) {
                if (registerError) {
                    registerError.className = 'auth-msg error';
                    let msg = error.message;
                    if (error.code === 'auth/email-already-in-use') {
                        msg = 'This email is already registered.';
                    } else if (error.code === 'auth/weak-password') {
                        msg = 'Password must be at least 6 characters.';
                    }
                    registerError.textContent = msg;
                }
            } finally {
                btn.disabled = false; if (btnLabel) btnLabel.textContent = 'Start Your Session';
            }
        });
    }

    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', async () => {
            try { await authFetch('/api/auth/logout', { method: 'POST' }); } catch { }
            Auth.clear();
            updateNavAuth();
        });
    }

});
