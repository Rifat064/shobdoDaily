const STORAGE_KEY = 'sd.android.ref.v1';

export const DEF = { 
    prefs: { theme: 'system', remind: true, time: '08:00', widget: true },
    mode: null, 
    learned: false, 
    bm: {} 
};

export let state = { ...DEF };

export function loadPrefs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            state = { ...DEF, ...parsed, prefs: { ...DEF.prefs, ...(parsed.prefs || {}) } };
            // Bridge old prototype format to modular format
            if (parsed.theme) state.prefs.theme = parsed.theme;
            if (parsed.time) state.prefs.time = parsed.time;
            if (parsed.remind !== undefined) state.prefs.remind = parsed.remind;
            if (parsed.widget !== undefined) state.prefs.widget = parsed.widget;
        }
    } catch(e) {
        console.warn('Failed to parse local state', e);
    }
}

export function savePrefs() {
    try { 
        // Save back in a shape compatible with the prototype's expectations
        const toSave = { 
            ...state,
            theme: state.prefs.theme,
            time: state.prefs.time,
            remind: state.prefs.remind,
            widget: state.prefs.widget
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); 
    } catch (e) { 
        console.warn('save failed', e); 
    }
}

export function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}
