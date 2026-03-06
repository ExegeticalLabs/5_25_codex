import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const WEB_WAKELOCK_KEY = '__myoboundWakeLock';

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export async function readJSON(key, fallback) {
  if (!isNativePlatform()) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  const serialized = JSON.stringify(value);

  if (!isNativePlatform()) {
    window.localStorage.setItem(key, serialized);
    return;
  }

  await Preferences.set({ key, value: serialized });
}

export async function readBool(key, fallback = false) {
  const value = await readJSON(key, fallback ? 1 : 0);
  return Boolean(value);
}

export async function writeBool(key, value) {
  await writeJSON(key, value ? 1 : 0);
}

export async function triggerHaptic(style = 'medium') {
  if (isNativePlatform()) {
    const mapping = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    };

    await Haptics.impact({ style: mapping[style] ?? ImpactStyle.Medium });
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (style === 'heavy') navigator.vibrate([40, 20, 40]);
    else if (style === 'light') navigator.vibrate(20);
    else navigator.vibrate(35);
  }
}

export async function setKeepAwake(enabled) {
  if (isNativePlatform()) {
    if (enabled) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
    return true;
  }

  if (typeof document === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (enabled) {
      const sentinel = await navigator.wakeLock.request('screen');
      window[WEB_WAKELOCK_KEY] = sentinel;
    } else if (window[WEB_WAKELOCK_KEY]) {
      await window[WEB_WAKELOCK_KEY].release();
      window[WEB_WAKELOCK_KEY] = null;
    }
    return true;
  } catch {
    return false;
  }
}

export async function exportBackupJSON(fileName, payloadObject) {
  const content = JSON.stringify(payloadObject, null, 2);

  if (isNativePlatform()) {
    const path = `backups/${fileName}`;

    await Filesystem.writeFile({
      path,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true
    });

    const uriResult = await Filesystem.getUri({ path, directory: Directory.Cache });

    await Share.share({
      title: 'MyoBound Backup',
      text: 'Exported MyoBound backup',
      url: uriResult.uri,
      dialogTitle: 'Share backup'
    });
    return;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
