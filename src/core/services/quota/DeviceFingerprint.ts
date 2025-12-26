/**
 * DeviceFingerprint
 *
 * Generates a lightweight browser fingerprint for quota binding.
 * This prevents copying quota state to a different device/browser.
 *
 * Note: This is not meant to be a tracking fingerprint - it's used
 * solely to bind quota state to a specific browser instance.
 */

/**
 * Generates a stable device fingerprint by hashing browser properties.
 * Returns a 16-character hex string.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    // User agent (browser + OS)
    navigator.userAgent,
    // Language preference
    navigator.language,
    // Screen dimensions (stable across sessions)
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    // Timezone
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Platform
    navigator.platform,
    // Hardware concurrency (CPU cores)
    navigator.hardwareConcurrency?.toString() || 'unknown',
    // Device memory (if available)
    (navigator as { deviceMemory?: number }).deviceMemory?.toString() || 'unknown',
  ];

  // Add canvas fingerprint for additional entropy
  const canvasFingerprint = await getCanvasFingerprint();
  if (canvasFingerprint) {
    components.push(canvasFingerprint);
  }

  // Combine and hash
  const combined = components.join('|');
  const hash = await sha256(combined);

  // Return first 16 characters for readability
  return hash.substring(0, 16);
}

/**
 * Generates a canvas-based fingerprint component.
 * Different GPUs/drivers render text slightly differently.
 */
async function getCanvasFingerprint(): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PURGE', 15, 5);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('quota', 60, 5);

    // Get data URL and hash it
    const dataUrl = canvas.toDataURL();
    return await sha256(dataUrl);
  } catch {
    // Canvas fingerprinting may fail in some browsers/contexts
    return null;
  }
}

/**
 * SHA-256 hash using Web Crypto API
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies if a fingerprint matches the current device.
 * Allows for minor variations (returns similarity score).
 */
export async function verifyDeviceFingerprint(
  storedFingerprint: string
): Promise<{ matches: boolean; similarity: number }> {
  const currentFingerprint = await generateDeviceFingerprint();

  if (currentFingerprint === storedFingerprint) {
    return { matches: true, similarity: 1.0 };
  }

  // Calculate character-level similarity for debugging
  // (fingerprint drift can happen with browser updates)
  let matching = 0;
  for (let i = 0; i < Math.min(currentFingerprint.length, storedFingerprint.length); i++) {
    if (currentFingerprint[i] === storedFingerprint[i]) {
      matching++;
    }
  }

  const similarity = matching / Math.max(currentFingerprint.length, storedFingerprint.length);

  // Consider it a match if >75% similar (accounts for minor browser updates)
  return {
    matches: similarity >= 0.75,
    similarity,
  };
}
