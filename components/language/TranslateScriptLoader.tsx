"use client";
import Script from 'next/script';
import { useEffect } from 'react';

const TranslateScriptLoader = () => {
  useEffect(() => {
    if (window.gtranslateSettings) return; 

    window.gtranslateSettings = {
      "default_language": "en",
      "languages": ["en","es","fr","de","it","pt"],
      "wrapper_selector": ".g-translate-container",
      "switcher_horizontal_position": "hidden",
      "switcher_vertical_position": "hidden",
      "float_switcher_open_direction": "top"
    };
  }, []);

  return (
    <>
      <Script
        src="https://cdn.gtranslate.net/widgets/latest/float.js"
        strategy="afterInteractive"
      />
      <div className="g-translate-container" style={{ visibility: 'hidden', position: 'absolute' }} />
    </>
  );
};

export default TranslateScriptLoader;