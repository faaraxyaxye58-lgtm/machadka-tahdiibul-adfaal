import React from 'react';
import { PaymentTransaction, SchoolSettings } from '../types';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface PrintReceiptModalProps {
  payment: PaymentTransaction;
  settings: SchoolSettings;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  payment,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold">Rasiidhka Bixinta Lacagta (Print Receipt)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Daabac (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 space-y-6 text-slate-800 bg-white" id="receipt-printable">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-amber-400 bg-emerald-50 p-1 shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-xl">
                    TA
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-emerald-950 leading-tight">
                  {settings.schoolName}
                </h1>
                <p className="text-xs text-slate-600">{settings.schoolSubtitle}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{settings.address}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-black uppercase tracking-wider">
                RASIIDHK
              </div>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                {payment.invoiceNumber}
              </p>
              <p className="text-[11px] text-slate-500">Taariikhda: {payment.date}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Magaca Ardayga:</span>
              <span className="font-bold text-slate-900 text-sm">{payment.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Waalidka / Mas'uulka:</span>
              <span className="font-bold text-slate-800">{payment.parentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Bisha Lacagta:</span>
              <span className="font-bold text-emerald-800">{payment.monthYear}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Habka Bixinta:</span>
              <span className="font-bold text-slate-800">{payment.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tixraaca (Ref / TX):</span>
              <span className="font-mono text-slate-800">{payment.transactionRef}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Lagu Qabtay:</span>
              <span className="font-medium text-slate-800">{payment.processedBy}</span>
            </div>
          </div>

          {/* Amount Paid Big Banner */}
          <div className="p-4 rounded-xl bg-emerald-900 text-white flex items-center justify-between shadow-inner">
            <div>
              <div className="text-xs text-emerald-200 font-medium">Wadarta Lacagta La Bixiyay:</div>
              <div className="text-2xl font-black text-amber-300">
                {settings.currency}{payment.amountPaid}.00 USD
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800/90 text-emerald-100 rounded-lg border border-emerald-700 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Loo Bixiyay Si Buuxda</span>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-12 border-b border-slate-300 flex items-end justify-center pb-1 font-mono text-slate-400">
                [Sexexa Qabaha]
              </div>
              <p className="text-slate-500 mt-1 text-[11px]">Sexexa Khasnajiga / Maaliyadda</p>
            </div>
            <div>
              <div className="h-12 border-b border-slate-300 flex items-end justify-center pb-1 font-mono text-slate-400">
                [Tambarta Dugsiga]
              </div>
              <p className="text-slate-500 mt-1 text-[11px]">Maamulka {settings.schoolName}</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2">
            Mahadsanid! Waad ku mahadsan tahay bixinta waqtigeeda. Tel: {settings.phone}
          </div>
        </div>
      </div>
    </div>
  );
};
