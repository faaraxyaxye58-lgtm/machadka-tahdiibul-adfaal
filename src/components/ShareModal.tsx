import React, { useState } from 'react';
import { Share2, Copy, Check, ShieldAlert, Globe, Users, X, ExternalLink, CheckCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // The public shareable URL provided by the platform preview infrastructure
  const publicShareUrl = 'https://ais-pre-4vr5apkz45bxqrvmk5wu4j-498313560058.europe-west1.run.app';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0e7a48] to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Share2 className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Wadaag Link-ga Guud (Public Share)</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  ♾️ Waligii Aan Dhaceenin
                </span>
              </div>
              <p className="text-xs text-emerald-100">Link-ga rasmiga ah ee abid shaqeynaya ku wadaag dadka kale, browser-ro iyo email-lo kala duwan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Explanation Box for All Roles */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
              <Users className="w-4 h-4 text-[#0e7a48] shrink-0" />
              <span>Link-gan wuxuu u shaqaynayaa Waalidka, Macallinka, Admin-ka iyo Ardayga!</span>
            </div>
            <p className="leading-relaxed">
              Marka uu qof kasta fura ama soo dagsado app-ka, waxaa toos ugu soo baxaya <strong>Doorashada Role-ka (Waaliid, Macallin, Admin, Arday)</strong> si uu u galo aaggiisa gaarka ah ama ugu tijaabiyo 1-click.
            </p>
          </div>

          {/* Explanation Box for 403 Error */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Maxaa dhacay markii hore ee '403 Error' u soo baxayay?</span>
            </div>
            <p className="leading-relaxed">
              Link-ga horumarinta (Development URL) oo ka bilaabanaaya <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">ais-dev-...</code> waa mid gaar ku ah koontadaada (private link).
              Qof kale oo lagu diro ama browser kale oo aan koontadaada ku furayn wuxuu bixinayaa <strong>403 Access Denied Error</strong>.
            </p>
            <p className="font-semibold text-emerald-800 flex items-center gap-1 mt-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isticmaal Link-ga Guud (Public Shared Link) ee hoose oo aan u samaynay!</span>
            </p>
          </div>

          {/* Copy Link Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#0e7a48]" />
                <span>Link-ga Rasmiga ah (Permanent Link):</span>
              </label>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                ✅ Waligii Aan Dhaceenin (Never Expires)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicShareUrl}
                className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 select-all focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-md transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#0e7a48] hover:bg-[#0b633a]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#d4af37]" />
                    <span>Laga Nuukhiyay!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#d4af37]" />
                    <span>Nuukhi (Copy)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Login Accounts guide for Shared Users */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0e7a48]" />
                <span>Koontooyinka Tijaabada ah ee dadku ku gali karaan (Demo Accounts)</span>
              </h3>
              <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-semibold">
                Email/Browser kasta
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-800 block text-[11px]">👨‍💼 Maamule (Admin)</span>
                <p className="text-slate-600 text-[10px]">Username: <code className="font-bold text-slate-900">admin</code></p>
                <p className="text-slate-600 text-[10px]">Password: <code className="font-bold text-slate-900">admin123</code></p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-blue-800 block text-[11px]">👨‍🏫 Macallin (Teacher)</span>
                <p className="text-slate-600 text-[10px]">Username: <code className="font-bold text-slate-900">macallin</code></p>
                <p className="text-slate-600 text-[10px]">Password: <code className="font-bold text-slate-900">123</code></p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-purple-800 block text-[11px]">👨‍👩‍👧 Waalid (Parent)</span>
                <p className="text-slate-600 text-[10px]">Username: <code className="font-bold text-slate-900">walid_1234567</code></p>
                <p className="text-slate-600 text-[10px]">Password: <code className="font-bold text-slate-900">123</code></p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-amber-800 block text-[11px]">🎓 Arday (Student)</span>
                <p className="text-slate-600 text-[10px]">Username: <code className="font-bold text-slate-900">STD-2026-001</code></p>
                <p className="text-slate-600 text-[10px]">Password: <code className="font-bold text-slate-900">123</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 flex items-center justify-between border-t border-slate-200">
          <a
            href={publicShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0e7a48] font-bold hover:underline flex items-center gap-1"
          >
            <span>Ku fur barta cusub (Open Public Link)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Waad Mahadsan tahay
          </button>
        </div>
      </div>
    </div>
  );
};
