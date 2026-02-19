/**
 * V8 App Extension - Crypto Utilities
 * AES-256-GCM encryption for secure token storage in chrome.storage
 */

const CRYPTO_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  // Derive key from extension ID + fixed salt (unique per installation)
  SALT: 'v8-app-ext-salt-2024',
};

/**
 * Derive a CryptoKey from the extension's unique ID.
 * This ensures tokens are only decryptable by this extension installation.
 */
async function _deriveKey() {
  const extensionId = chrome.runtime.id || 'v8-app-fallback-id';
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(extensionId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(CRYPTO_CONFIG.SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: CRYPTO_CONFIG.ALGORITHM, length: CRYPTO_CONFIG.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing IV + ciphertext.
 */
async function encryptToken(plaintext) {
  if (!plaintext) return null;
  
  try {
    const key = await _deriveKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH));

    const encrypted = await crypto.subtle.encrypt(
      { name: CRYPTO_CONFIG.ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine IV + ciphertext into a single array
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Base64 encode for storage
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error('[Crypto] Encryption failed:', e);
    return null;
  }
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 * Returns the original plaintext string.
 */
async function decryptToken(encryptedBase64) {
  if (!encryptedBase64) return null;

  try {
    const key = await _deriveKey();
    
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, CRYPTO_CONFIG.IV_LENGTH);
    const ciphertext = combined.slice(CRYPTO_CONFIG.IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: CRYPTO_CONFIG.ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('[Crypto] Decryption failed:', e);
    return null;
  }
}

/**
 * Securely store a token in chrome.storage.local (encrypted).
 */
async function secureStoreToken(key, value) {
  const encrypted = await encryptToken(value);
  if (encrypted) {
    const storageObj = {};
    storageObj[key] = encrypted;
    storageObj[key + '_encrypted'] = true;
    await chrome.storage.local.set(storageObj);
    return true;
  }
  return false;
}

/**
 * Retrieve and decrypt a token from chrome.storage.local.
 */
async function secureGetToken(key) {
  const data = await chrome.storage.local.get([key, key + '_encrypted']);
  
  if (data[key + '_encrypted']) {
    // Encrypted token — decrypt it
    return await decryptToken(data[key]);
  }
  
  // Legacy unencrypted token — migrate it
  if (data[key]) {
    console.log('[Crypto] Migrating legacy unencrypted token:', key);
    await secureStoreToken(key, data[key]);
    return data[key];
  }
  
  return null;
}

/**
 * Securely remove a token from storage.
 */
async function secureRemoveToken(key) {
  await chrome.storage.local.remove([key, key + '_encrypted']);
}
