import { db } from '../../data/firebase.js';
import { collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

export function initAdminView(say) {
    const adminForm = document.getElementById('adminForm');
    if (!adminForm) return;

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('adDate').value = tomorrow.toISOString().split('T')[0];

    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dateKey = document.getElementById('adDate').value;
        const word = document.getElementById('adWord').value.trim();
        const ipa = document.getElementById('adIpa').value.trim();
        const tags = document.getElementById('adTags').value.split(',').map(t => t.trim()).filter(Boolean);
        const contextEn = document.getElementById('adContextEn').value.trim();
        const contextBn = document.getElementById('adContextBn').value.trim();

        const cardData = {
            publish_date: dateKey,
            status: 'published',
            words: [
                {
                    word: word,
                    phonetic: ipa,
                    tags: tags,
                    context_en: contextEn,
                    context_bn: contextBn
                }
            ],
            created_at: new Date().toISOString()
        };

        const submitBtn = adminForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Publishing...';
        submitBtn.disabled = true;

        try {
            // We use the dateKey as the document ID for easy lookup
            const cardRef = doc(db, 'cards', dateKey);
            await setDoc(cardRef, cardData);
            
            say(`Success! Card published for ${dateKey}`);
            
            // Clear form except date
            document.getElementById('adWord').value = '';
            document.getElementById('adIpa').value = '';
            document.getElementById('adTags').value = '';
            document.getElementById('adContextEn').value = '';
            document.getElementById('adContextBn').value = '';
            
            // Advance date to next day automatically
            const nextDate = new Date(dateKey);
            nextDate.setDate(nextDate.getDate() + 1);
            document.getElementById('adDate').value = nextDate.toISOString().split('T')[0];

        } catch (err) {
            console.error("Error publishing card:", err);
            say('Error: Check console. Missing Firestore permissions?');
        } finally {
            submitBtn.textContent = 'Publish to Database';
            submitBtn.disabled = false;
        }
    });
}
