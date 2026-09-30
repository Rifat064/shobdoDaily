import { getCardByDate, putCard } from '../../data/idb.js';
import { getTodayKey } from '../../core/dates.js';
import { state, savePrefs } from '../../core/state.js';
import { fetchCardFromFirebase } from '../../data/firebase.js';

// Milestone data definitions
const MILESTONES = {
    bcs: { icon: '📚', title: 'BCS Foundation', desc: 'Master 1,000 essential words that appear most frequently in BCS preliminary exams.', total: 1000, progress: 8, unlocked: true },
    ielts: { icon: '🌍', title: 'IELTS Academic', desc: 'Build your Band 7+ vocabulary with academic word lists and collocations.', total: 2000, progress: 0, unlocked: false },
    mba: { icon: '💼', title: 'Business Fluency', desc: 'Executive-level vocabulary for MBA entrance, case studies, and boardroom confidence.', total: 1500, progress: 0, unlocked: false }
};

export async function initHomeView(say) {
    const $ = (s, root=document) => root.querySelector(s);
    const $$ = (s, root=document) => [...root.querySelectorAll(s)];
    
    // Set today label
    $('#todayLabel').textContent = 'Today / ' + new Intl.DateTimeFormat('en-GB', { 
        timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric' 
    }).format(new Date());

    const paintStats = () => {
        const words = 8 + (state.learned ? 2 : 0);
        const days = 6 + (state.learned ? 1 : 0);
        $('#sDays').textContent = String(days).padStart(2, '0');
        $('#sWords').textContent = words;
        $('#sPct').textContent = (words / 10).toFixed(1) + '%';
        $('#msPct').textContent = Math.round(words / 10) + '%';
        
        const lBtn = document.getElementById('learnBtn');
        if (lBtn) {
            lBtn.setAttribute('aria-pressed', String(!!state.learned));
            document.getElementById('learnText').textContent = state.learned ? 'Learned today' : "Mark today's card learned";
        }
    };

    // ── Audio Pronunciation (Web Speech API — free) ──
    $$('.say-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = btn.dataset.say;
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                const utt = new SpeechSynthesisUtterance(word);
                utt.lang = 'en-US';
                utt.rate = 0.85;
                speechSynthesis.speak(utt);
                // Visual feedback
                btn.style.background = 'rgba(255,255,255,.3)';
                setTimeout(() => btn.style.background = '', 400);
                say(`🔊 ${word}`);
            } else {
                say('Audio not available on this device');
            }
        });
    });

    // ── Bookmark binding ──
    $$('.bm').forEach(bmBtn => {
        const bmId = bmBtn.dataset.bm;
        bmBtn.setAttribute('aria-pressed', String(!!state.bm[bmId]));
        
        bmBtn.addEventListener('click', () => {
            state.bm[bmId] = !state.bm[bmId];
            bmBtn.setAttribute('aria-pressed', String(!!state.bm[bmId])); 
            savePrefs(); 
            window.dispatchEvent(new CustomEvent('bookmarks-updated'));
            say(state.bm[bmId] ? 'Bookmarked' : 'Bookmark removed');
        });
    });

    // ── Learn binding ──
    const lBtn = $('#learnBtn');
    if (lBtn) {
        lBtn.addEventListener('click', () => { 
            state.learned = !state.learned; 
            savePrefs(); 
            paintStats(); 
            say(state.learned ? 'Nice. Today is done.' : 'Marked as not learned'); 
        });
    }

    // ── Milestone buttons (interactive) ──
    $$('.ms-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const exam = btn.dataset.exam;
            const ms = MILESTONES[exam];
            if (!ms) return;

            if (!ms.unlocked) {
                // Show paywall
                const paywall = document.getElementById('paywallModal');
                paywall.style.display = 'flex';
                return;
            }

            // Show milestone detail modal
            const modal = document.getElementById('milestoneModal');
            document.getElementById('msIcon').textContent = ms.icon;
            document.getElementById('msTitle').textContent = ms.title;
            document.getElementById('msDesc').textContent = ms.desc;
            document.getElementById('msFill').style.width = Math.round((ms.progress / ms.total) * 100) + '%';
            document.getElementById('msProgress').textContent = `${ms.progress} / ${ms.total.toLocaleString()} words`;
            modal.style.display = 'flex';
        });
    });

    // ── Modal close handlers (milestone only — paywall is owned by premium.js) ──
    const closeModal = (id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    };

    document.getElementById('milestoneClose')?.addEventListener('click', () => closeModal('milestoneModal'));
    document.getElementById('msAction')?.addEventListener('click', () => { closeModal('milestoneModal'); say('Keep going! One card at a time.'); });
    
    document.getElementById('milestoneModal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal('milestoneModal');
    });

    paintStats();
}
