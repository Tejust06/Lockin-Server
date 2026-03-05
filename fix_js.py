import sys

with open('c:\\Users\\Tejas\\OneDrive\\Desktop\\Antigravity\\locking\\lockin-app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: Hero Timer
old_timer_block = '''    /* ── INTERACTIVE SESSION COMMITMENT UI ─────────────────────────── */
    const heroTimer = document.getElementById('hero-timer');
    const durationSlider = document.getElementById('mock-duration-slider');
    const durationDisplay = document.getElementById('mock-duration-display');
    const stakeAmountDisplay = document.getElementById('mock-stake-amount');
    const stakeBtns = document.querySelectorAll('.btn-stake');
    const initiateBtn = document.getElementById('mock-initiate-btn');

    if (heroTimer && durationSlider) {'''
    
new_timer_block = '''    /* ── INTERACTIVE SESSION COMMITMENT UI ─────────────────────────── */
    const heroTimer = document.getElementById('hero-timer');
    const initiateBtn = document.getElementById('mock-initiate-btn');
    const glassPreview = document.querySelector('.phone-container.phone-1');

    if (heroTimer && initiateBtn) {'''

text = text.replace(old_timer_block, new_timer_block)

old_slider_logic = '''        // 1. Slider Interaction
        durationSlider.addEventListener('input', (e) => {
            if (isSessionLocked) {
                e.preventDefault();
                return;
            }
            const newTotal = parseInt(e.target.value, 10);
            durationDisplay.textContent = `${newTotal} min`;
            resetTimer();
        });'''

text = text.replace(old_slider_logic, '''        const updateTimerDisplay = () => {
            heroTimer.textContent = `${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
        };''')

# Let's just do a big replace for the entire timer section up to magnetic buttons
timer_start = text.find('    /* ── INTERACTIVE SESSION COMMITMENT UI ─────────────────────────── */')
timer_end = text.find('    /* ── MAGNETIC BUTTONS (HOVER INTERACTION) ───────────────────────── */')

new_timer_full = '''    /* ── INTERACTIVE SESSION COMMITMENT UI ─────────────────────────── */
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

'''

if timer_start != -1 and timer_end != -1:
    text = text[:timer_start] + new_timer_full + text[timer_end:]

# Fix 2: Checkout flow hookup
checkout_start = text.find('    /* ── STRIPE CHECKOUT FLOW ────────────────────────────────────────── */')
checkout_end = text.find('});\n', checkout_start) + 4

new_checkout_full = '''    /* ── STRIPE CHECKOUT FLOW ────────────────────────────────────────── */
    const pricingBtns = document.querySelectorAll('#pricing .btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout');

    if (pricingBtns.length > 0 && checkoutModal) {
        pricingBtns.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (index === 0) {
                    alert('You have selected the Free tier. Redirecting to dashboard...');
                    return;
                }
                window.currentCheckoutPlanId = index === 1 ? 'deposit' : 'pro';
                
                // Open modal
                checkoutModal.classList.add('active');
                checkoutModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            });
        });

        if (closeCheckoutBtn) {
            closeCheckoutBtn.addEventListener('click', () => {
                checkoutModal.classList.remove('active');
                checkoutModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            });
        }
    }

    /* ── CHECKOUT FRICTION LOGIC ─────────────────────────────────────── */
    const contractInput = document.getElementById('contract-input');
    const payBtn = document.getElementById('btn-submit-pay');

    if (contractInput && payBtn) {
        // Disable button initially via CSS styles
        payBtn.style.opacity = '0.5';
        payBtn.style.pointerEvents = 'none';

        contractInput.addEventListener('input', (e) => {
            if (e.target.value === 'I ACCEPT THE RISK') {
                payBtn.style.opacity = '1';
                payBtn.style.pointerEvents = 'auto';
                payBtn.style.background = 'var(--color-danger)';
                payBtn.style.color = '#fff';
                document.getElementById('pay-text').textContent = 'Confirm Financial Risk';
            } else {
                payBtn.style.opacity = '0.5';
                payBtn.style.pointerEvents = 'none';
                payBtn.style.background = '#ffffff';
                payBtn.style.color = '#000000';
                document.getElementById('pay-text').textContent = 'Commit Stake';
            }
        });
        
        payBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const originalText = document.getElementById('pay-text');
            if (originalText) originalText.textContent = 'Securing...';
            payBtn.style.pointerEvents = 'none';
            payBtn.style.opacity = '0.7';

            try {
                const planId = window.currentCheckoutPlanId || 'deposit';
                const response = await fetch('http://localhost:3000/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId })
                });

                const data = await response.json();

                if (data.url) {
                    window.location.href = data.url; // Redirect to Stripe
                } else {
                    console.error('Checkout error:', data.error);
                    alert('Payment initialization failed. Is your server running?');
                    if (originalText) originalText.textContent = 'Retry';
                    payBtn.style.pointerEvents = 'auto';
                    payBtn.style.opacity = '1';
                }
            } catch (error) {
                console.error('Network error calling checkout API:', error);
                
                // Simulate network delay then vibrate fail to fit friction theme
                if (originalText) originalText.textContent = 'Commit Stake';
                payBtn.classList.remove('vibrate');
                void payBtn.offsetWidth; // trigger reflow
                payBtn.classList.add('vibrate');

                setTimeout(() => {
                    payBtn.classList.remove('vibrate');
                    payBtn.style.pointerEvents = 'auto';
                    payBtn.style.opacity = '1';
                }, 300);
            }
        });
    }

});
'''

if checkout_start != -1:
    text = text[:checkout_start] + new_checkout_full

with open('c:\\Users\\Tejas\\OneDrive\\Desktop\\Antigravity\\locking\\lockin-app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
