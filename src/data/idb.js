/**
 * IndexedDB Wrapper
 */
const DB_NAME = 'shobdo_db';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('cards')) {
                db.createObjectStore('cards', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('progress')) {
                db.createObjectStore('progress', { keyPath: 'cardId' });
            }
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    return dbPromise;
}

export async function putCard(card) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cards', 'readwrite');
        tx.objectStore('cards').put(card);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getCardByDate(dateStr) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cards', 'readonly');
        const store = tx.objectStore('cards');
        const request = store.getAll(); // Simplified for prototype
        request.onsuccess = () => {
            const match = request.result.find(c => c.publish_date === dateStr);
            resolve(match || null);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function getAllCards() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cards', 'readonly');
        const request = tx.objectStore('cards').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
