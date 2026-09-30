import { loadPrefs, state } from '../core/state.js';
import { Router } from './router.js';
import { initHomeView } from './views/home.js';
import { initSettingsView } from './views/settings.js';
import { initBookmarkView } from './views/bookmark.js';
import { initPremiumView } from './views/premium.js';
// Auth imported from our Firebase pipeline
import { auth, listenToAuth } from '../data/firebase.js';

function initApp() {
    console.log('Shobdo Daily - Initializing Modular Architecture + Firebase Pipeline...');
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker registered', reg);
        }).catch(err => {
            console.error('Service Worker registration failed', err);
        });
    }

    // Tactical Splash Screen Logic
    const splash = document.getElementById('splash');
    const splashBar = document.getElementById('splash-bar');
    const splashStatus = document.getElementById('splash-status');
    
    if (splash) {
        let progress = 0;
        const interval = setInterval(() => {
            // Randomly advance progress to simulate real loading
            progress += Math.random() * 18;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                splashStatus.textContent = 'Ready!';
                splashBar.style.width = '100%';
                
                // Wait briefly on 100%, then fade out
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => {
                        splash.remove(); // Remove from DOM after transition
                        
                        // Hard Login Requirement (Real Firebase Auth)
                        if (state.mode !== 'google') {
                            say('Please wait, preparing Google Sign In...');
                            // Call real Firebase Auth. It will either open a popup or redirect.
                            // If Web config is missing, this will throw an error to the console.
                            import('../data/firebase.js').then(({ loginWithGoogle }) => {
                                loginWithGoogle().then(user => {
                                    if (user) {
                                        state.mode = 'google';
                                        localStorage.setItem('sd.android.ref.v1', JSON.stringify(state));
                                        say('Signed in successfully');
                                    }
                                }).catch(err => {
                                    console.error("Firebase Auth Error:", err);
                                    say('Auth Error: Make sure Web App is configured in Firebase');
                                });
                            });
                        }
                    }, 600);
                }, 700);
            } else {
                splashBar.style.width = progress + '%';
            }
        }, 120);
    }

    // Load local state
    loadPrefs();
    
    // Global Toast functionality
    const toastEl = document.getElementById('toast'); 
    let tt;
    const say = msg => { 
        toastEl.textContent = msg; 
        toastEl.classList.add('show'); 
        clearTimeout(tt); 
        tt = setTimeout(() => toastEl.classList.remove('show'), 3500); 
    };

    // Connectivity indicator
    const net = () => { 
        const on = navigator.onLine; 
        document.getElementById('netDot').classList.toggle('off', !on); 
        document.getElementById('netText').textContent = on ? 'Ready offline' : 'Offline · all good'; 
    };
    window.addEventListener('online', net); 
    window.addEventListener('offline', net);
    net();

    // Initialize Router (handles the 5 views)
    const router = new Router(['home', 'bookmark', 'settings', 'premium', 'admin']);
    router.init();

    // Bind Modular Views
    initHomeView(say);
    initSettingsView(say);
    initBookmarkView(say);
    initPremiumView(say);
    import('./views/admin.js').then(m => m.initAdminView(say));

    // Listen to actual Firebase Auth state
    listenToAuth((user) => {
        const greetName = document.getElementById('greetName');
        const googleModeBtn = document.getElementById('googleMode');
        const guestModeBtn = document.getElementById('guestMode');
        
        if(user) {
            console.log("Firebase Auth: Logged in as", user.email);
            state.mode = 'google';
            const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Student';
            
            if(greetName) greetName.textContent = `, ${firstName}`;
            if(googleModeBtn) googleModeBtn.classList.add('sel');
            if(guestModeBtn) guestModeBtn.classList.remove('sel');
            
            say(`Welcome back, ${firstName}!`);
        } else {
            console.log("Firebase Auth: Logged out");
            // Do not force UI to guest if it was simulated in dev
            if (state.mode !== 'google') {
                if(greetName) greetName.textContent = '';
                if(googleModeBtn) googleModeBtn.classList.remove('sel');
                if(guestModeBtn) guestModeBtn.classList.add('sel');
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
