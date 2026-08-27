import React, { useState } from 'react';

interface ModalsProps {
  showAccount: boolean;
  showSettings: boolean;
  showHelp: boolean;
  onClose: () => void;
}

export const AppModals: React.FC<ModalsProps> = ({
  showAccount,
  showSettings,
  showHelp,
  onClose,
}) => {
  const [ezlinkBalance, setEzlinkBalance] = useState<number>(34.80);
  const [topupAmount, setTopupAmount] = useState<number>(10);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [lessWalking, setLessWalking] = useState(false);
  const [liveDisruptionAlerts, setLiveDisruptionAlerts] = useState(true);
  const [topupSuccess, setTopupSuccess] = useState(false);

  if (!showAccount && !showSettings && !showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      {/* Account Modal */}
      {showAccount && (
        <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#c1c6d3] shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center border-b border-[#c1c6d3] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004481] text-[24px]">account_circle</span>
              <h3 className="font-bold text-lg text-[#1c1b1f]">SimplyGo / EZ-Link Account</h3>
            </div>
            <button onClick={onClose} className="text-[#727783] hover:text-[#1c1b1f]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Card Mockup */}
          <div className="bg-gradient-to-tr from-[#004481] to-[#005baa] text-white rounded-xl p-5 shadow-md flex flex-col justify-between h-44 relative overflow-hidden">
            <div className="absolute right-3 -bottom-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#bbd4ff] font-bold">SimplyGo Adult Card</span>
                <div className="font-mono text-sm tracking-wider mt-1">9810 •••• •••• 4209</div>
              </div>
              <span className="material-symbols-outlined text-white/80 text-[28px]">contactless</span>
            </div>

            <div>
              <span className="text-xs text-[#bbd4ff]">Stored Value Balance</span>
              <div className="text-3xl font-bold font-mono tracking-tight">
                ${ezlinkBalance.toFixed(2)}
              </div>
            </div>
          </div>

          {topupSuccess && (
            <div className="bg-[#83fc94]/40 border border-[#006e2a] text-[#00752d] text-xs font-semibold p-2.5 rounded-lg text-center">
              Successfully topped up ${topupAmount.toFixed(2)}!
            </div>
          )}

          {/* Quick Top-up */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#414751]">Quick Stored-Value Top Up</span>
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(amt)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    topupAmount === amt
                      ? 'bg-[#004481] text-white border-[#004481]'
                      : 'bg-[#f7f2f8] text-[#414751] border-[#c1c6d3] hover:bg-[#e5e1e7]'
                  }`}
                >
                  +${amt}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setEzlinkBalance((prev) => prev + topupAmount);
                setTopupSuccess(true);
                setTimeout(() => setTopupSuccess(false), 2000);
              }}
              className="mt-2 w-full bg-[#006e2a] hover:bg-[#00531e] text-white py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Top Up with PayNow / Credit Card
            </button>
          </div>

          <div className="text-[11px] text-[#727783] text-center border-t border-[#f1ecf2] pt-3">
            Auto Top-up is active via DBS/POSB Mastercard.
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#c1c6d3] shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center border-b border-[#c1c6d3] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004481] text-[24px]">settings</span>
              <h3 className="font-bold text-lg text-[#1c1b1f]">Routing & Commute Preferences</h3>
            </div>
            <button onClick={onClose} className="text-[#727783] hover:text-[#1c1b1f]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between p-3 bg-[#f7f2f8] rounded-xl border border-[#c1c6d3] cursor-pointer">
              <div>
                <span className="text-sm font-bold text-[#1c1b1f] block">Wheelchair / Stroller Accessible</span>
                <span className="text-xs text-[#727783]">Prioritize barrier-free MRT lifts and ramped buses</span>
              </div>
              <input
                type="checkbox"
                checked={wheelchairAccessible}
                onChange={(e) => setWheelchairAccessible(e.target.checked)}
                className="w-5 h-5 rounded text-[#004481] focus:ring-[#004481]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#f7f2f8] rounded-xl border border-[#c1c6d3] cursor-pointer">
              <div>
                <span className="text-sm font-bold text-[#1c1b1f] block">Sheltered Walkways & Less Walking</span>
                <span className="text-xs text-[#727783]">Minimize walking distance during rainy weather</span>
              </div>
              <input
                type="checkbox"
                checked={lessWalking}
                onChange={(e) => setLessWalking(e.target.checked)}
                className="w-5 h-5 rounded text-[#004481] focus:ring-[#004481]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#f7f2f8] rounded-xl border border-[#c1c6d3] cursor-pointer">
              <div>
                <span className="text-sm font-bold text-[#1c1b1f] block">Live Disruption Push Alerts</span>
                <span className="text-xs text-[#727783]">Receive instant announcements for your saved commute lines</span>
              </div>
              <input
                type="checkbox"
                checked={liveDisruptionAlerts}
                onChange={(e) => setLiveDisruptionAlerts(e.target.checked)}
                className="w-5 h-5 rounded text-[#004481] focus:ring-[#004481]"
              />
            </label>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#004481] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#005baa]"
          >
            Save Preferences
          </button>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#c1c6d3] shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center border-b border-[#c1c6d3] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004481] text-[24px]">help_outline</span>
              <h3 className="font-bold text-lg text-[#1c1b1f]">Smart Transport Navigator Guide</h3>
            </div>
            <button onClick={onClose} className="text-[#727783] hover:text-[#1c1b1f]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="text-xs text-[#414751] flex flex-col gap-3">
            <div className="bg-[#f7f2f8] p-3 rounded-lg border border-[#c1c6d3]">
              <h4 className="font-bold text-[#1c1b1f] mb-1">Fare Structure & Transfer Rules</h4>
              <p>
                Distance-based fares apply seamlessly between MRT, LRT, and public buses within 45 minutes of transferring. Simply tap the same card or mobile contactless device.
              </p>
            </div>

            <div className="bg-[#f7f2f8] p-3 rounded-lg border border-[#c1c6d3]">
              <h4 className="font-bold text-[#1c1b1f] mb-1">Live LTA DataMall Telemetry Integration</h4>
              <p>
                Connected via backend proxy to official Land Transport Authority (LTA) APIs:
                BusArrival v3 (with automatic 20-second refresh), Traffic Incidents (EMAS), and Train Service Alerts.
              </p>
            </div>

            <div className="bg-[#f7f2f8] p-3 rounded-lg border border-[#c1c6d3]">
              <h4 className="font-bold text-[#1c1b1f] mb-1">Transport Support & OCC Hotline</h4>
              <p>
                Smart Transport Support: <strong>1800-336-8900</strong> (7:30 AM - 8:00 PM daily)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#004481] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#005baa]"
          >
            Close Guide
          </button>
        </div>
      )}
    </div>
  );
};
