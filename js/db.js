const DB_NAME = 'SeivaDB';
const DB_VERSION = 4;

class SeivaDB {
    constructor() {
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store for Projects
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                    projectStore.createIndex('name', 'name', { unique: false });
                    projectStore.createIndex('status', 'status', { unique: false });
                }

                // Store for Socioambiental Interviews
                if (!db.objectStoreNames.contains('socioambiental')) {
                    const formStore = db.createObjectStore('socioambiental', { keyPath: 'id' });
                    formStore.createIndex('projectId', 'projectId', { unique: false });
                    formStore.createIndex('date', 'date', { unique: false });
                    formStore.createIndex('syncStatus', 'syncStatus', { unique: false }); // 'pending', 'synced'
                }

                // Store for Photos (blobs) - identifying by parent ID + type
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
                    photoStore.createIndex('parentId', 'parentId', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
        });
    }

    // Generic CRUD Operations
    async add(storeName, data) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, indexValue = null) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            let request;

            if (indexName && indexValue) {
                const index = store.index(indexName);
                request = index.getAll(indexValue);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new SeivaDB();
