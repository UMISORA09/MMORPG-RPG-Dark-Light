import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Ngăn chặn Vercel Browser Extension tự động tiêm Vercel Toolbar và các banner cảnh báo lên màn hình game
if (typeof window !== 'undefined') {
  (window as any).__VERCEL_TOOLBAR_DISABLED__ = true;

  const purgeVercelToolbar = () => {
    const nodes = document.querySelectorAll(
      'vercel-toolbar, #vercel-toolbar, [data-vercel-toolbar], [data-feedback-wrapper], [class*="vercel-toolbar"]'
    );
    nodes.forEach((n) => n.remove());
  };

  purgeVercelToolbar();

  if (typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver(() => {
      purgeVercelToolbar();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
