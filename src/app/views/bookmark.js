import { state } from '../../core/state.js';

// Full vocabulary database — each card links words together
const VOCAB_DB = {
    stubborn_waive: {
        cardId: '007',
        day: 7,
        image: './assets/waive.jpg',
        sentence: 'A stubborn student says, "I won\'t waive the rule!"',
        context: 'একজন একগুঁয়ে (stubborn) শিক্ষার্থী বলল, "আমি নিয়ম শিথিল (waive) করব না!"',
        words: [
            { en: 'Stubborn', bn: 'একগুঁয়ে, জেদি', ipa: '/ˈstʌb.ərn/', pos: 'adjective', emoji: '🐂', exams: ['BCS','IELTS'] },
            { en: 'Waive', bn: 'ত্যাগ করা, শিথিল করা', ipa: '/weɪv/', pos: 'verb', emoji: '📜', exams: ['BCS','GRE'] }
        ]
    },
    // Mock older bookmarks as if they were saved from past daily cards
    fastidious: {
        cardId: '006', day: 6, image: null,
        sentence: 'A fastidious editor checked every line twice.',
        context: 'একজন খুঁতখুঁতে (fastidious) সম্পাদক প্রতিটি লাইন দুবার পরীক্ষা করেছিলেন।',
        words: [
            { en: 'Fastidious', bn: 'খুঁতখুঁতে, অতিরিক্ত বাছাই-পছন্দকারী', ipa: '/fæˈstɪd.i.əs/', pos: 'adjective', emoji: '🔬', exams: ['GRE','IELTS'] }
        ]
    },
    pragmatic: {
        cardId: '005', day: 5, image: null,
        sentence: 'Be pragmatic — use what works, not what sounds fancy.',
        context: 'বাস্তববাদী (pragmatic) হও — যা কাজ করে তা ব্যবহার করো, শুধু ফ্যান্সি শোনায় এমন কিছু নয়।',
        words: [
            { en: 'Pragmatic', bn: 'বাস্তববাদী, ব্যবহারিক', ipa: '/præɡˈmæt.ɪk/', pos: 'adjective', emoji: '🎯', exams: ['BCS','GRE','IELTS'] }
        ]
    },
    lucid: {
        cardId: '004', day: 4, image: null,
        sentence: 'Her lucid explanation made the concept crystal clear.',
        context: 'তার স্বচ্ছ (lucid) ব্যাখ্যা ধারণাটিকে স্ফটিক পরিষ্কার করে দিয়েছিল।',
        words: [
            { en: 'Lucid', bn: 'স্বচ্ছ, পরিষ্কার, বোধগম্য', ipa: '/ˈluː.sɪd/', pos: 'adjective', emoji: '💎', exams: ['GRE','IELTS'] }
        ]
    },
    tenacious: {
        cardId: '003', day: 3, image: null,
        sentence: 'A tenacious competitor never gives up.',
        context: 'একজন অধ্যবসায়ী (tenacious) প্রতিযোগী কখনো হার মানে না।',
        words: [
            { en: 'Tenacious', bn: 'অধ্যবসায়ী, দৃঢ়, ছাড়তে না চাওয়া', ipa: '/təˈneɪ.ʃəs/', pos: 'adjective', emoji: '🦾', exams: ['BCS','GRE'] }
        ]
    },
    nuance: {
        cardId: '002', day: 2, image: null,
        sentence: 'Every nuance of her speech carried weight.',
        context: 'তার বক্তব্যের প্রতিটি সূক্ষ্মতা (nuance) গুরুত্ব বহন করতো।',
        words: [
            { en: 'Nuance', bn: 'সূক্ষ্ম পার্থক্য, সূক্ষ্মতা', ipa: '/ˈnjuː.ɑːns/', pos: 'noun', emoji: '🎨', exams: ['GRE','IELTS'] }
        ]
    }
};

export function initBookmarkView(say) {
    const box = document.getElementById('bmList');
    const emptyEl = document.getElementById('bmEmpty');
    const searchInput = document.getElementById('bmSearch');

    const drawList = (filter = '') => {
        box.replaceChildren();
        const filterLower = filter.toLowerCase();

        // Active bookmarks from state
        let activeKeys = Object.keys(state.bm).filter(k => state.bm[k]);
        
        // Always show mock bookmarks for the demo (in production these come from IDB)
        const allKeys = [...new Set([...activeKeys, 'fastidious', 'pragmatic', 'lucid', 'tenacious', 'nuance'])];

        // Filter by search
        const filtered = allKeys.filter(key => {
            const entry = VOCAB_DB[key];
            if (!entry) return false;
            if (!filterLower) return true;
            return entry.words.some(w => 
                w.en.toLowerCase().includes(filterLower) || 
                w.bn.includes(filterLower) ||
                w.exams.some(e => e.toLowerCase().includes(filterLower))
            );
        });

        if (filtered.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }
        emptyEl.style.display = 'none';

        filtered.forEach(key => {
            const entry = VOCAB_DB[key];
            if (!entry) return;
            
            entry.words.forEach(word => {
                const card = document.createElement('div');
                card.className = 'bm-card';

                // Header
                const header = document.createElement('div');
                header.className = 'bm-card-header';
                
                const left = document.createElement('div');
                left.innerHTML = `<span style="font-size:20px;margin-right:8px;">${word.emoji}</span>
                    <strong>${word.en}</strong>`;
                left.style.display = 'flex';
                left.style.alignItems = 'center';

                const right = document.createElement('div');
                right.style.display = 'flex';
                right.style.gap = '4px';
                right.style.alignItems = 'center';
                word.exams.forEach(ex => {
                    const tag = document.createElement('span');
                    tag.className = `exam-tag ${ex.toLowerCase()}`;
                    tag.textContent = ex;
                    right.appendChild(tag);
                });
                // Day indicator
                const dayPill = document.createElement('span');
                dayPill.className = 'pill';
                dayPill.style.marginLeft = '6px';
                dayPill.textContent = `DAY ${String(entry.day).padStart(2,'0')}`;
                right.appendChild(dayPill);

                header.append(left, right);

                // Detail panel (hidden by default)
                const detail = document.createElement('div');
                detail.className = 'bm-card-detail';
                detail.innerHTML = `
                    <div class="phonetics-line">
                        <span class="ipa">${word.ipa}</span>
                        <span class="pos-tag">${word.pos}</span>
                        <button class="say-btn bm-say" data-say="${word.en}" aria-label="Hear ${word.en}">
                            <svg class="i" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><use href="#i-say"/></svg>
                        </button>
                    </div>
                    <div class="bm-meaning"><strong>${word.en}</strong> = (${word.bn})</div>
                    <div class="bm-sentence">"${entry.sentence}"</div>
                    <div class="bm-meaning" style="font-size:13px;opacity:.7;margin-top:6px;">${entry.context}</div>
                `;

                card.append(header, detail);

                // Toggle expand/collapse
                header.addEventListener('click', () => {
                    card.classList.toggle('expanded');
                });

                // Audio on say button
                detail.querySelector('.bm-say')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const w = e.currentTarget.dataset.say;
                    if ('speechSynthesis' in window) {
                        speechSynthesis.cancel();
                        const utt = new SpeechSynthesisUtterance(w);
                        utt.lang = 'en-US';
                        utt.rate = 0.85;
                        speechSynthesis.speak(utt);
                        say(`🔊 ${w}`);
                    }
                });

                box.appendChild(card);
            });
        });
    };

    // Search filtering
    searchInput.addEventListener('input', (e) => {
        drawList(e.target.value);
    });

    drawList();
    window.addEventListener('bookmarks-updated', () => drawList(searchInput.value));
}
