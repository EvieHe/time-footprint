import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.jsx';
import './style.css';
import './mobile/mobile.css';

const root = createRoot(document.getElementById('root'));
async function start() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { bootstrapNativeActivity } = await import('./mobile/bootstrap.js');
      window.activityAPI = await bootstrapNativeActivity();
    } catch (error) {
      console.error('Native database initialization failed', error);
      root.render(<main className="mobile-boot-error"><h1>无法打开本地记录</h1><p>请重新打开应用。数据不会被清除。</p><small>{String(error?.message || error)}</small></main>);
      return;
    }
  }
  root.render(<App />);
}
start();
