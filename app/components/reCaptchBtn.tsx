'use client';

import React,{ useEffect, useState } from 'react';
import Script from 'next/script';
import { Button } from 'antd';

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

if (!RECAPTCHA_SITE_KEY) {
  throw new Error('RECAPTCHA_SITE_KEY 環境變數未設定');
}

const RecaptchaButton: React.FC = () => {
  const [ready, setReady] = useState(false);

    useEffect(() => {
        const handleLoad = () => {
            console.log('✅ reCAPTCHA 已載入 (event)');
            setReady(true);
        };

        if (window.grecaptcha?.enterprise) {
            setReady(true); // 已經載入了
        } else {
            window.addEventListener('recaptcha-loaded', handleLoad);
        }

        return () => {
            window.removeEventListener('recaptcha-loaded', handleLoad);
        };
    }, []);

  const handleClick = () => {
    if (!window.grecaptcha?.enterprise) {
      console.error('reCAPTCHA 尚未載入');
      return;
    }

    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, {
          action: 'LOGIN',
        });

        console.log('✅ 取得 token:', token);
        console.log('👉 把 token 傳送給後端做驗證');
        const res = await fetch('/api/recaptcha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recaptchaToken: token,
                recaptchaAction: 'LOGIN',
            }),
        });

        const data = await res.json();
        console.log('驗證結果', data);

      } catch (err) {
        console.error('reCAPTCHA 執行錯誤:', err);
      }
    });
  };

  return (
    <>
     {/* ✅ 動態載入 Google reCAPTCHA Enterprise Script  */}
      <Script
        src={`https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`}
        strategy="afterInteractive" // 只在 client 載入
        onLoad={() => {
            console.log('✅ reCAPTCHA script 載入完成');
            window.dispatchEvent(new Event('recaptcha-loaded'));
        }}
      />
        <Button onClick={handleClick}>
            驗證 reCAPTCHA
        </Button>
    </>
    
  );
};

export default RecaptchaButton;
