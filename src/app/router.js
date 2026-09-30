export class Router {
    constructor(views) {
        this.views = views; // e.g. ['home', 'bookmark', 'settings', 'premium']
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Bind bottom nav
        document.querySelectorAll('[data-go]').forEach(b => {
            b.addEventListener('click', () => { 
                window.location.hash = '/' + b.dataset.go; 
            });
        });
    }

    init() {
        this.handleRoute();
    }

    handleRoute() {
        let hash = window.location.hash.slice(2);
        if (!this.views.includes(hash)) hash = 'home';
        
        // Toggle view visibility
        document.querySelectorAll('.view').forEach(x => {
            x.classList.toggle('active', x.id === 'view-' + hash);
        });
        
        // Toggle bottom nav aria-current
        document.querySelectorAll('.nav button').forEach(b => {
            if (b.dataset.go === hash) {
                b.setAttribute('aria-current', 'page');
            } else {
                b.removeAttribute('aria-current');
            }
        });
        
        window.scrollTo(0, 0);
    }
}
