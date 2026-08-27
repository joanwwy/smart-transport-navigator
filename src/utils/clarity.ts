// Microsoft Clarity helper and fallback initializer
export function initClarity(projectId: string = 'y8vc1qbg2i') {
  if (typeof window === 'undefined') return;

  // Check if Clarity is already initialized
  if ((window as any).clarity) return;

  try {
    (function(c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
      c[a] = c[a] || function() {
        (c[a].q = c[a].q || []).push(arguments);
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      if (y && y.parentNode) {
        y.parentNode.insertBefore(t, y);
      } else {
        l.head.appendChild(t);
      }
    })(window, document, 'clarity', 'script', projectId);
  } catch (err) {
    console.warn('Clarity init notice:', err);
  }
}
