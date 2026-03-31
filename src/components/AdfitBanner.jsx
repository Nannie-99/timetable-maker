import React, { useEffect } from 'react';

const AdfitBanner = () => {
  useEffect(() => {
    // Kakao AdFit script loading logic for SPA compatibility
    const script = document.createElement('script');
    script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove the script tag and the generated ad content if necessary
      // Note: AdFit creates multiple elements, so we focus on the script removal
      try {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      } catch (e) {
        console.error('Adfit cleanup error:', e);
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center w-full min-h-[50px] mb-2 overflow-hidden bg-transparent">
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit="DAN-Xo1ESlkY0LPYvVuy"
        data-ad-width="320"
        data-ad-height="50"
      ></ins>
    </div>
  );
};

export default React.memo(AdfitBanner);
