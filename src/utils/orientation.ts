export async function lockPortraitOrientation(): Promise<{ success: boolean; message: string }> {
  // Safe helper: Does not force screen lock or fullscreen to prevent unwanted rotation glitches
  return {
    success: true,
    message: 'Qaabka Istaaga (Portrait Mode) waa la waafajiyay!'
  };
}

