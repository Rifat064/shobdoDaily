import { state, savePrefs } from '../../core/state.js';

export function initPremiumView(say) {
    const dlBtn = document.getElementById('dlBtn');
    const fill = document.getElementById('fill');
    const dlPct = document.getElementById('dlPct');
    const dlLabel = document.getElementById('dlLabel');

    let selectedPlan = 'yearly';
    const PRICES = { yearly: '৳299', monthly: '৳59' };

    // ═══════ Payment Step Management ═══════
    const showStep = (n) => {
        [1,2,3,4,5].forEach(i => {
            const el = document.getElementById(`payStep${i}`);
            if (el) el.style.display = i === n ? 'block' : 'none';
        });
    };

    const closePaywall = () => {
        document.getElementById('paywallModal').style.display = 'none';
        showStep(1); // Reset to step 1
    };

    // ═══════ Step 1: Plan selection ═══════
    document.querySelectorAll('.price-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.price-option').forEach(o => o.classList.remove('popular'));
            el.classList.add('popular');
            selectedPlan = el.dataset.plan;
        });
    });

    document.getElementById('payProceed')?.addEventListener('click', () => {
        document.getElementById('payAmount').textContent = PRICES[selectedPlan];
        showStep(2);
    });

    // ═══════ Step 2: Phone number ═══════
    const phoneInput = document.getElementById('payPhone');
    const sendOtpBtn = document.getElementById('paySendOtp');
    
    phoneInput?.addEventListener('input', () => {
        const valid = /^1[3-9]\d{7,8}$/.test(phoneInput.value);
        sendOtpBtn.disabled = !valid;
    });

    sendOtpBtn?.addEventListener('click', () => {
        const phone = '+880' + phoneInput.value;
        document.getElementById('payPhoneDisplay').textContent = phone;
        say('OTP sent to ' + phone);
        showStep(3);
        // Auto-fill OTP after 2s (simulating real SMS delivery)
        setTimeout(() => {
            document.getElementById('payOtp').value = '482916';
            document.getElementById('payVerifyOtp').disabled = false;
            say('OTP received: 482916');
        }, 2500);
    });

    // ═══════ Step 3: OTP verification ═══════
    const otpInput = document.getElementById('payOtp');
    const verifyOtpBtn = document.getElementById('payVerifyOtp');

    otpInput?.addEventListener('input', () => {
        verifyOtpBtn.disabled = otpInput.value.length < 6;
    });

    verifyOtpBtn?.addEventListener('click', () => {
        if (otpInput.value.length >= 6) {
            say('OTP verified ✓');
            showStep(4);
        }
    });

    document.getElementById('payResendOtp')?.addEventListener('click', () => {
        say('New OTP sent!');
        otpInput.value = '';
        setTimeout(() => {
            otpInput.value = '193847';
            verifyOtpBtn.disabled = false;
            say('New OTP received: 193847');
        }, 2000);
    });

    // ═══════ Step 4: PIN entry ═══════
    const pinInput = document.getElementById('payPin');
    const confirmBtn = document.getElementById('payConfirm');

    pinInput?.addEventListener('input', () => {
        confirmBtn.disabled = pinInput.value.length < 4;
    });

    confirmBtn?.addEventListener('click', () => {
        confirmBtn.textContent = 'Processing...';
        confirmBtn.disabled = true;

        // Simulate payment processing
        setTimeout(() => {
            const txId = 'SD' + Date.now().toString(36).toUpperCase();
            document.getElementById('payTxId').textContent = txId;
            
            // Save premium state
            state.premium = true;
            state.premiumTxId = txId;
            state.premiumExpiry = Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 86400000;
            savePrefs();

            showStep(5);
            say('Payment successful! 🎉');
            confirmBtn.textContent = 'Confirm Payment';
        }, 2500);
    });

    // ═══════ Step 5: Done ═══════
    document.getElementById('payDone')?.addEventListener('click', () => {
        closePaywall();
        unlockPremiumUI();
    });

    // ═══════ Close handlers ═══════
    document.getElementById('paywallClose')?.addEventListener('click', closePaywall);
    document.getElementById('paywallModal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closePaywall();
    });

    // ═══════ Watch Ads Flow ═══════
    let adsWatched = 0;
    const adsModal = document.getElementById('adsModal');

    document.getElementById('watchAdsBtn')?.addEventListener('click', () => {
        document.getElementById('paywallModal').style.display = 'none';
        adsWatched = 0;
        startAd();
    });

    function startAd() {
        adsModal.style.display = 'flex';
        adsWatched++;
        document.getElementById('adTitle').textContent = `Watch Ad ${adsWatched} of 3`;
        const timer = document.getElementById('adTimer');
        const skipBtn = document.getElementById('adSkip');
        const countdown = document.getElementById('adCountdown');
        skipBtn.disabled = true;
        skipBtn.style.opacity = '0.5';
        let sec = 15;
        countdown.textContent = sec;
        timer.textContent = `Ad playing... ${sec}s`;

        const intv = setInterval(() => {
            sec--;
            countdown.textContent = sec;
            timer.textContent = `Ad playing... ${sec}s`;
            if (sec <= 5) {
                skipBtn.disabled = false;
                skipBtn.style.opacity = '1';
                skipBtn.textContent = adsWatched < 3 ? `Next ad (${adsWatched}/3)` : 'Unlock Premium!';
            }
            if (sec <= 0) {
                clearInterval(intv);
                skipBtn.disabled = false;
                skipBtn.style.opacity = '1';
                timer.textContent = 'Ad complete ✓';
            }
        }, 1000);

        skipBtn.onclick = () => {
            clearInterval(intv);
            if (adsWatched < 3) {
                startAd();
            } else {
                adsModal.style.display = 'none';
                // Grant 1-day premium
                state.premium = true;
                state.premiumExpiry = Date.now() + 86400000;
                state.premiumSource = 'ads';
                savePrefs();
                unlockPremiumUI();
                say('Premium unlocked for 24 hours! 🎉');
            }
        };
    }

    document.getElementById('adsClose')?.addEventListener('click', () => {
        adsModal.style.display = 'none';
    });

    // ═══════ Download Logic ═══════
    let busy = false;

    function unlockPremiumUI() {
        dlBtn.textContent = '⬇️ Download offline library';
        dlBtn.classList.remove('premium-dl');
        dlBtn.style.background = 'var(--ok)';
        dlBtn.style.color = '#fff';
    }

    function startDownload() {
        if (busy) return;
        busy = true;
        dlBtn.disabled = true;
        dlBtn.textContent = '⬇️ Downloading…';
        let n = 0;

        const t = setInterval(() => {
            n = Math.min(100, n + 7);
            fill.style.width = n + '%';
            dlPct.textContent = n + '%';
            dlLabel.textContent = n < 100 
                ? `Downloading · ${Math.round(n * 30)} / 3000 words` 
                : 'Offline library ready ✓';
            if (n >= 100) {
                clearInterval(t);
                dlBtn.textContent = '✅ Library available offline';
                say('Offline library is ready! 🎉');
            }
        }, 300);
    }

    dlBtn.addEventListener('click', () => {
        if (state.premium) {
            startDownload();
        } else {
            document.getElementById('paywallModal').style.display = 'flex';
        }
    });

    // Check if already premium on load
    if (state.premium && state.premiumExpiry > Date.now()) {
        unlockPremiumUI();
    } else {
        state.premium = false;
    }
}
