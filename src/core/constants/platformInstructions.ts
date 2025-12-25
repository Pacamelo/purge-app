/**
 * Platform detection and offline instructions
 * Shared between OfflineBlockedState and NetworkModeToggle components
 */

export type Platform = 'mac' | 'windows' | 'ios' | 'android' | 'unknown';

/**
 * Detect user's platform for tailored instructions
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x/.test(ua)) return 'mac';
  if (/windows/.test(ua)) return 'windows';

  return 'unknown';
}

/**
 * Platform-specific offline instructions
 */
export const PLATFORM_INSTRUCTIONS: Record<Platform, { icon: string; steps: string[] }> = {
  mac: {
    icon: '',
    steps: [
      'Click the WiFi icon in the menu bar',
      'Select "Turn Wi-Fi Off"',
      'Or press Option + click WiFi icon for quick toggle',
    ],
  },
  windows: {
    icon: '',
    steps: [
      'Click the network icon in the taskbar',
      'Toggle "Wi-Fi" to Off',
      'Or enable "Airplane mode"',
    ],
  },
  ios: {
    icon: '',
    steps: [
      'Swipe down from top-right for Control Center',
      'Tap the airplane icon',
      'Or go to Settings > Airplane Mode',
    ],
  },
  android: {
    icon: '',
    steps: [
      'Swipe down from the top of the screen',
      'Tap "Airplane mode" in Quick Settings',
      'Or go to Settings > Network > Airplane mode',
    ],
  },
  unknown: {
    icon: '',
    steps: [
      'Disconnect from WiFi',
      'Or enable Airplane Mode',
      'Or unplug your ethernet cable',
    ],
  },
};
