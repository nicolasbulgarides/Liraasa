/* Learn: persistence (ADR-0015).
 *
 * IndexedDB, database "liraasa-learn":
 *   kv      progress (the exported JSON), overrides draft, lexicon changes
 *   audio   recorded clips, keyed by item id or sentence key
 * If IndexedDB is unavailable (a private window, blocked storage), kv falls
 * back to localStorage and audio is unavailable; nothing else changes.
 * The progress schema and its migrations live in the core (progress.ts).
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const NAME = 'liraasa-learn';
  const VERSION = 1;
  const PREFIX = 'liraasa-learn:';
  let opening = null;

  function open() {
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      if (!root.indexedDB) {
        reject(new Error('IndexedDB is not available'));
        return;
      }
      const req = root.indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return opening;
  }

  function run(store, mode, fn) {
    return open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(store, mode);
          const req = fn(tx.objectStore(store));
          tx.oncomplete = () => resolve(req ? req.result : undefined);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        }),
    );
  }

  const local = {
    get(key) {
      try {
        const v = root.localStorage.getItem(PREFIX + key);
        return v === null ? undefined : JSON.parse(v);
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        root.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        /* storage full or blocked: the session still works */
      }
    },
    del(key) {
      try {
        root.localStorage.removeItem(PREFIX + key);
      } catch {
        /* nothing to do */
      }
    },
  };

  U.store = {
    async get(key) {
      try {
        return await run('kv', 'readonly', (s) => s.get(key));
      } catch {
        return local.get(key);
      }
    },
    async set(key, value) {
      try {
        await run('kv', 'readwrite', (s) => s.put(value, key));
      } catch {
        local.set(key, value);
      }
    },
    async del(key) {
      try {
        await run('kv', 'readwrite', (s) => s.delete(key));
      } catch {
        local.del(key);
      }
    },
    async audioGet(key) {
      try {
        return await run('audio', 'readonly', (s) => s.get(key));
      } catch {
        return undefined;
      }
    },
    async audioSet(key, blob) {
      await run('audio', 'readwrite', (s) => s.put(blob, key));
    },
    async audioDel(key) {
      await run('audio', 'readwrite', (s) => s.delete(key));
    },
    async audioKeys() {
      try {
        return (await run('audio', 'readonly', (s) => s.getAllKeys())) || [];
      } catch {
        return [];
      }
    },
  };

  /* a download, from a string or a blob */
  U.download = function download(name, content, type) {
    const blob =
      content instanceof Blob ? content : new Blob([content], { type: type || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* a file the user picks, read as text or as a blob */
  U.pickFile = function pickFile(accept, asText) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return resolve(null);
        if (!asText) return resolve(file);
        file.text().then((text) => resolve({ file, text }));
      });
      input.click();
    });
  };

  U.blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });

  U.dataUrlToBlob = (url) => fetch(url).then((r) => r.blob());
})(typeof window !== 'undefined' ? window : globalThis);
