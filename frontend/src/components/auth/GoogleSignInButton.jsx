import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-services';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
};

const GoogleSignInButton = ({ onCredential, onError }) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (!GOOGLE_CLIENT_ID) {
          return;
        }

        await loadGoogleScript();
        if (cancelled) {
          return;
        }

        const google = window.google;
        if (!google?.accounts?.id || !containerRef.current) {
          return;
        }

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredential?.(response.credential);
            } else {
              onError?.(new Error('Missing credential from Google'));
            }
          },
        });

        containerRef.current.innerHTML = '';
        google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 360,
        });

        setReady(true);
      } catch (error) {
        onError?.(error);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div>
      <div ref={containerRef} className="w-full" />
      {!ready && (
        <p className="text-xs text-dark-400 mt-2">Loading Google sign-in...</p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
