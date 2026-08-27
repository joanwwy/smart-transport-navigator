import React, { useEffect } from 'react';

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: { reload: boolean; config?: () => void }) => void;
    };
    disqus_config?: () => void;
  }
}

export const CommunityDiscussionsView: React.FC = () => {
  useEffect(() => {
    const pageUrl = window.location.href;
    const pageIdentifier = 'smart-transport-navigator-discussions';

    // Set configuration
    window.disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
    };

    const disqusScriptId = 'disqus-embed-script';
    const existingScript = document.getElementById(disqusScriptId);

    if (!existingScript) {
      const d = document;
      const s = d.createElement('script');
      s.id = disqusScriptId;
      s.src = 'https://smart-transport-navigator.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      (d.head || d.body).appendChild(s);
    } else if (window.DISQUS) {
      // If script is already in document, reset the thread for fresh render
      window.DISQUS.reset({
        reload: true,
        config: function (this: any) {
          this.page.url = pageUrl;
          this.page.identifier = pageIdentifier;
        },
      });
    }
  }, []);

  return (
    <div className="flex-1 w-full max-w-[1100px] mx-auto p-4 md:p-8 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#c1c6d3] rounded-2xl p-6 mb-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#004481] text-white flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[28px]">forum</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1c1b1f] tracking-tight">
                Commuter Community & Discussions
              </h1>
              <p className="text-sm text-[#414751] mt-0.5">
                Share live route tips, report sudden ground delays, or discuss Singapore transit queries with fellow commuters.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#004787] bg-[#d5e3ff] px-3 py-1.5 rounded-full border border-[#a6c8ff]">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Disqus Live Thread</span>
          </div>
        </div>

        {/* Helpful Discussion Topics */}
        <div className="mt-4 pt-4 border-t border-[#f1ecf2] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#414751]">
          <div className="flex items-center gap-2 bg-[#fdf8fd] p-2.5 rounded-lg border border-[#e5e1e7]">
            <span className="material-symbols-outlined text-[#004481] text-[18px]">commute</span>
            <span>Alternate bus & MRT routes</span>
          </div>
          <div className="flex items-center gap-2 bg-[#fdf8fd] p-2.5 rounded-lg border border-[#e5e1e7]">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">traffic</span>
            <span>Ground bottleneck reports</span>
          </div>
          <div className="flex items-center gap-2 bg-[#fdf8fd] p-2.5 rounded-lg border border-[#e5e1e7]">
            <span className="material-symbols-outlined text-[#00752d] text-[18px]">recommend</span>
            <span>Feature suggestions & feedback</span>
          </div>
        </div>
      </div>

      {/* Disqus Comments Container */}
      <div className="bg-white border border-[#c1c6d3] rounded-2xl p-6 md:p-8 shadow-sm">
        <div id="disqus_thread" className="min-h-[300px]"></div>
        <noscript>
          Please enable JavaScript to view the{' '}
          <a href="https://disqus.com/?ref_noscript" className="text-[#004481] underline" target="_blank" rel="noreferrer">
            comments powered by Disqus.
          </a>
        </noscript>
      </div>
    </div>
  );
};
