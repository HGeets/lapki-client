import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import './assets/styles/fira-sans.css';
import './assets/styles/fira-mono.css';
import { App } from './App';
import { WhoopsieScreen } from './components/WhoopsieScreen';
import { initAppVersion } from './version';

initAppVersion();

console.log("Текущий URL:", window.location.href);

// перехватчик
if (window.location.href.includes('state-editor')) {
  
  document.body.innerHTML = '<div id="editor-root" style="width: 100vw; height: 100vh;"></div>';
  
  const editorRoot = document.getElementById('editor-root') as HTMLElement;
  
  createRoot(editorRoot).render(
    <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e', color: '#10b981' }}>
      <h1>Бу</h1>
    </div>
  );
} else {
  const rootElement = document.getElementById('root') as HTMLElement;
  createRoot(rootElement).render(
    <StrictMode>
      <WhoopsieScreen>
        <App />
      </WhoopsieScreen>
    </StrictMode>
  );
}