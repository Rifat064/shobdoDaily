import { state, savePrefs, DEF } from '../../core/state.js';
import { loginWithGoogle, logoutUser } from '../../data/firebase.js';

export function initSettingsView(say) {
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];

    // ── Theme ──
    const paintTheme = () => {
        document.documentElement.dataset.theme = state.prefs.theme;
        $$('[data-theme-choice]').forEach(o => o.classList.toggle('sel', o.dataset.themeChoice === state.prefs.theme));
        $('#themeColor').content = getComputedStyle(document.documentElement).getPropertyValue('--navy').trim();
    };

    $$('[data-theme-choice]').forEach(o => o.addEventListener('click', () => { 
        state.prefs.theme = o.dataset.themeChoice; 
        paintTheme(); 
        savePrefs(); 
        say(o.querySelector('strong').textContent + ' selected'); 
    }));

    // ── Switches ──
    const sw = (id, key, msg) => { 
        const el = $(id); 
        const paint = () => el.setAttribute('aria-checked', String(state.prefs[key])); 
        paint();
        el.addEventListener('click', () => { 
            state.prefs[key] = !state.prefs[key]; 
            paint(); 
            savePrefs(); 
            say(msg + (state.prefs[key] ? ' on' : ' off')); 
        }); 
    };
    
    sw('#notifySwitch', 'remind', 'Reminder'); 
    sw('#widgetSwitch', 'widget', 'Widget');
    
    $('#notifyTime').value = state.prefs.time;
    $('#notifyTime').addEventListener('change', e => { 
        state.prefs.time = e.target.value; 
        savePrefs(); 
        say('Reminder set for ' + state.prefs.time);
        scheduleReminder();
    });

    // ── Notification Permission ──
    const notifBtn = $('#notifPermBtn');
    const notifStatus = $('#notifStatus');

    const updateNotifUI = () => {
        if (!('Notification' in window)) {
            notifBtn.textContent = '⚠️ Notifications not supported';
            notifBtn.disabled = true;
            notifStatus.textContent = 'Your browser does not support notifications.';
            return;
        }
        if (Notification.permission === 'granted') {
            notifBtn.textContent = '✅ Notifications allowed';
            notifBtn.classList.add('granted');
            notifStatus.textContent = 'You will receive reminders at ' + state.prefs.time + ' daily.';
        } else if (Notification.permission === 'denied') {
            notifBtn.textContent = '🚫 Notifications blocked';
            notifBtn.disabled = true;
            notifStatus.textContent = 'Go to browser settings to re-enable notifications for this site.';
        } else {
            notifBtn.textContent = '🔔 Allow notification permission';
            notifStatus.textContent = '';
        }
    };

    notifBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') return;

        const result = await Notification.requestPermission();
        updateNotifUI();
        if (result === 'granted') {
            say('Notifications enabled! 🔔');
            // Fire a test notification immediately
            new Notification('Shobdo Daily', {
                body: 'Notifications are working! You\'ll get daily reminders.',
                icon: './assets/waive.jpg'
            });
            scheduleReminder();
        } else {
            say('Notification permission denied.');
        }
    });

    // Schedule a reminder notification (uses setTimeout for the next occurrence)
    let reminderTimer = null;
    function scheduleReminder() {
        if (reminderTimer) clearTimeout(reminderTimer);
        if (!state.prefs.remind || Notification.permission !== 'granted') return;

        const [hh, mm] = state.prefs.time.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(hh, mm, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1); // Next day if time has passed

        const ms = target - now;
        reminderTimer = setTimeout(() => {
            new Notification('Shobdo Daily 📚', {
                body: "Your today's card is ready. Tap to open and learn 2 new words!",
                icon: './assets/waive.jpg',
                tag: 'sd-daily-reminder'
            });
            say('Reminder fired! 🔔');
            scheduleReminder(); // Re-schedule for next day
        }, ms);

        const hours = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        notifStatus.textContent = `Next reminder in ${hours}h ${mins}m (${state.prefs.time}).`;
    }

    updateNotifUI();
    if (Notification.permission === 'granted' && state.prefs.remind) {
        scheduleReminder();
    }

    // ── Reset ──
    $('#resetBtn').addEventListener('click', () => {
        if (!confirm('Erase all progress and preferences on this device?')) return;
        Object.assign(state.prefs, DEF.prefs);
        state.mode = DEF.mode;
        state.learned = DEF.learned;
        state.bm = {};
        savePrefs(); 
        paintTheme(); 
        $('#notifyTime').value = state.prefs.time; 
        ['#notifySwitch', '#widgetSwitch'].forEach(s => $(s).setAttribute('aria-checked', 'true'));
        $$('.bm').forEach(b => b.setAttribute('aria-pressed', 'false')); 
        say('Local data erased');
        window.location.reload();
    });

    paintTheme();
}
