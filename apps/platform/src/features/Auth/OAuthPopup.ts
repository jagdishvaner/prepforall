const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 600;

export function openOAuthPopup(provider: 'google' | 'github'): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const url = `${apiBase}/api/v1/auth/${provider}`;
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

    const popup = window.open(
      url,
      `${provider}_login`,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=yes`
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== window.location.origin) return;

      const { type, access_token, error } = event.data ?? {};
      if (type !== 'oauth_callback') return;

      window.removeEventListener('message', handleMessage);
      clearInterval(pollTimer);

      if (error) {
        reject(new Error(error));
      } else if (access_token) {
        resolve(access_token as string);
      } else {
        reject(new Error('No token received'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll to detect if popup was closed manually
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Login cancelled'));
      }
    }, 500);
  });
}
