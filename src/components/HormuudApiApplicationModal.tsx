import React, { useState } from 'react';
import { SchoolSettings, User, HormuudApiApplicationRecord } from '../types';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Printer,
  X,
  Send,
  ShieldCheck,
  Award,
  Zap,
  Clock,
  Phone,
  Mail,
  FileCheck,
  Check,
  Download,
  Copy,
  Layers,
  HelpCircle,
  UserCheck
} from 'lucide-react';

interface HormuudApiApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: User;
  onSaveSettings: (updatedSettings: Partial<SchoolSettings>) => void;
}

export const HormuudApiApplicationModal: React.FC<HormuudApiApplicationModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onSaveSettings,
}) => {
  const [activeStep, setActiveStep] = useState<'form' | 'letter_preview' | 'documents' | 'submit_status'>('form');

  // Form State
  const [institutionName, setInstitutionName] = useState(settings.schoolName || 'Machadka Tahdiibul Adfaal Quranic MIS');
  const [directorName, setDirectorName] = useState(currentUser.name || 'Eng. Yaxye Faarax');
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '+252615000000');
  const [contactEmail, setContactEmail] = useState(currentUser.email || 'faaraxyaxye58@gmail.com');
  const [requestedSenderId, setRequestedSenderId] = useState('TAHDIIB-MIS');

  // Services State
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Bulk SMS API (Integration)',
    'Sender ID Masking (Approved Sender Name)',
    'Real-time SMS Status Webhooks',
    'EVC Plus Payment API Integration'
  ]);

  // Documents Attached State
  const [officialLetterAttached, setOfficialLetterAttached] = useState(true);
  const [educationalLicenseAttached, setEducationalLicenseAttached] = useState(true);
  const [directorIdAttached, setDirectorIdAttached] = useState(true);
  const [systemCertificateAttached, setSystemCertificateAttached] = useState(true);

  // Upload Simulation State
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([
    { name: 'Shatiga_Wasaaradda_Waxbarashada_Tahdiibul_Adfaal.pdf', size: '2.4 MB', type: 'Educational License' },
    { name: 'Passport_Maamulaha_Machadka.pdf', size: '1.1 MB', type: 'Director ID' },
    { name: 'System_Identification_Certificate_v4.5.pdf', size: '850 KB', type: 'System Certificate' },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionRecord, setSubmissionRecord] = useState<HormuudApiApplicationRecord | null>(
    settings.hormuudApplication || null
  );

  const [copiedAppId, setCopiedAppId] = useState(false);

  if (!isOpen) return null;

  const toggleService = (srv: string) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter((s) => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((f: File) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: 'Dukumiinti Dheeraad ah',
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleSubmitApplication = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const newRecord: HormuudApiApplicationRecord = {
        id: `HORMUUD-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        submissionDate: new Date().toLocaleDateString('so-SO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        institutionName,
        directorName,
        contactPhone,
        contactEmail,
        requestedSenderId,
        servicesRequested: selectedServices,
        documentsSubmitted: {
          officialLetterAttached,
          educationalLicenseAttached,
          directorIdAttached,
          systemCertificateAttached,
        },
        status: 'SUBMITTED',
        notes: 'Codsigaaga iyo dukumiintiyadaadu si guul leh ayaa looga diiwaangeliyay Hormuud Telecom API Portal.',
      };

      setSubmissionRecord(newRecord);
      onSaveSettings({
        ...settings,
        hormuudApplication: newRecord,
      });

      setIsSubmitting(false);
      setActiveStep('submit_status');
    }, 1500);
  };

  const handlePrintLetter = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between border-b-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-amber-300 rounded-2xl shadow-lg border border-emerald-400">
              <Zap className="w-6 h-6 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  OFFICIAL API APPLICATION PORTAL
                </span>
                <span className="text-emerald-400 text-xs font-bold">HORMUUD TELECOM ENTERPRISE</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                CODSIGA API-GA HORMUUD & GUDBINTA DUKUMIINTIYADA
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Wizard Navigation Steps */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveStep('form')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeStep === 'form'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#0e7a48]" />
            <span>1. Form-ka Codsiga</span>
          </button>

          <button
            onClick={() => setActiveStep('letter_preview')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeStep === 'letter_preview'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>2. Warqadda Codsiga (Letterhead)</span>
          </button>

          <button
            onClick={() => setActiveStep('documents')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeStep === 'documents'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>3. Gudbinta Dukumiintiyada</span>
          </button>

          <button
            onClick={() => setActiveStep('submit_status')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeStep === 'submit_status'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>4. Xaaladda Codsiga (Status)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto bg-slate-50/50 space-y-6">

          {/* STEP 1: FORM-KA CODSIGA */}
          {activeStep === 'form' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-5 h-5 text-[#0e7a48]" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Xogta Machadka & Maamulaha Codsanaya</h3>
                    <p className="text-xs text-slate-500">Geli xogta rasmiga ah ee Machadka Tahdiibul Adfaal si Hormuud ay u aqoonsato codsigaaga.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">Magaca Machadka (Institution Name):</label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0e7a48] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">Magaca Maamulaha / Director Name:</label>
                    <input
                      type="text"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0e7a48] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">Telefoonka Xiriirka (Phone Number):</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0e7a48] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">Email-ka Rasmiga ah (Email):</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0e7a48] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-black text-slate-700 block">
                    Sender ID Masking la Codsanayo (Magaca SMS-ka lagu dirayo e.g., TAHDIIB-MIS):
                  </label>
                  <input
                    type="text"
                    value={requestedSenderId}
                    onChange={(e) => setRequestedSenderId(e.target.value.toUpperCase())}
                    className="w-full sm:w-1/2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black text-[#0e7a48] focus:ring-2 focus:ring-[#0e7a48] outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Magacan waa kan ka muuqan doona telefoonka waalidka marka uu SMS soo dhaco.
                  </span>
                </div>
              </div>

              {/* SERVICES SELECTION */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider block">
                  Adeegyada Hormuud API ee Machadku Codsanayo:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Bulk SMS API (Integration)',
                    'Sender ID Masking (Approved Sender Name)',
                    'Real-time SMS Status Webhooks',
                    'EVC Plus Payment API Integration',
                    'Merchant Account Auto-Reconciliation',
                    'Dedicated Enterprise IP Whitelisting'
                  ].map((srv, idx) => {
                    const isChecked = selectedServices.includes(srv);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleService(srv)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{srv}</span>
                        {isChecked ? <CheckCircle2 className="w-4 h-4 text-[#0e7a48] shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('letter_preview')}
                  className="px-6 py-3 bg-[#0e7a48] hover:bg-[#095733] text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <span>Agaasimayaa Warqadda Codsiga (Next)</span>
                  <FileText className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: WARQADDA CODSIGA (OFFICIAL LETTERHEAD) */}
          {activeStep === 'letter_preview' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Warqadda Codsiga Rasmiga ah (Official Request Letter)</h3>
                  <p className="text-xs text-slate-500">
                    Sida ku qeexan shuruudaha Hormuud Enterprise, warqaddan waxaa loo gudbinayaa Maamulka API-yada ee Hormuud Telecom.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintLetter}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Daabac (Print / Save PDF)</span>
                  </button>
                </div>
              </div>

              {/* PRINTABLE OFFICIAL LETTER CONTAINER */}
              <div className="p-8 sm:p-12 bg-white text-slate-950 rounded-2xl border-2 border-slate-300 shadow-xl space-y-6 font-serif max-w-4xl mx-auto leading-relaxed">
                
                {/* Letterhead Header */}
                <div className="flex items-center justify-between border-b-4 border-[#0e7a48] pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#0e7a48] text-amber-300 flex items-center justify-center font-black text-2xl shadow-md border border-emerald-700">
                      م
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-[#0e7a48] tracking-tight uppercase font-sans">
                        {institutionName}
                      </h1>
                      <p className="text-xs text-slate-600 font-bold font-sans">
                        TAHDIIBUL ADFAAL QURANIC & EDUCATION SYSTEM
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        License No: EDU-SOM-2026-8890 • Tel: {contactPhone}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-600 space-y-1 font-sans">
                    <p><strong>Taariikhda:</strong> {new Date().toLocaleDateString('so-SO')}</p>
                    <p><strong>Tix:</strong> TAHDIIB/HORMUUD/API/2026/01</p>
                  </div>
                </div>

                {/* Recipient Address */}
                <div className="space-y-1 text-xs font-sans font-semibold text-slate-800 pt-2">
                  <p className="font-bold text-slate-900">Ku: Maamulka API-yada & Enterprise Services</p>
                  <p className="font-bold text-[#0e7a48]">Hormuud Telecom Somalia</p>
                  <p>Mogadishu / Hargeisa / Garowe, Somalia</p>
                </div>

                {/* Subject */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-center text-xs font-black text-slate-950 uppercase font-sans">
                  UJEEDDO: CODSIGA API-GA HORMUUD SMS GATEWAY & SENDER ID MASKING ({requestedSenderId})
                </div>

                {/* Letter Body */}
                <div className="text-xs text-slate-800 space-y-4 font-sans leading-relaxed text-justify">
                  <p>
                    Kaddib salaan qadderin leh, waxa nala sharaf ah in aan idiin soo gudbino codsigan rasmiga ah ee ku saabsan ku xiridda nidaamka maamulka waxbarashada ee Machadka Tahdiibul Adfaal (`Tahdiibul Adfaal MIS v4.5 Enterprise Edition`) iyo nidaamka SMS Gateway-ga Hormuud Telecom.
                  </p>
                  <p>
                    Machadku wuxuu doonayaa in uu si otomaatig ah fariimaha ogeysiiska xaadiriska, natiijooyinka imtixaanka, iyo risiidhadaha bixinta lacagaha waxbarashada ugu diro waalidiinta ardayda dhata Machadka. Sidaas darteed waxaan idinka codsanaynaa in aad na siisaan API Credentials (API Key, Token, Username, Password) iyo Sender ID-ga rasmiga ah oo ah: <strong className="text-[#0e7a48] underline font-mono text-sm">[{requestedSenderId}]</strong>.
                  </p>
                  <p>
                    Wuxuu machadku ballan-qaadayaa in uu u hoggaansamo dhammaan shuruucda iyo ilaalinta asturnaanta fariimaha ee dalka iyo kuwa Hormuud Telecom. Dukumiintiyadii loo baahnaa ee kala ahaa Shatiga Waxbarashada, Kaarka Aqoonsiga Maamulaha, iyo Shahaadada Aqoonsiga Nidaamka waxa ay ku qabsan yihiin codsigan.
                  </p>
                </div>

                {/* Signoff & Stamp */}
                <div className="flex items-end justify-between pt-8 border-t border-slate-200">
                  <div className="space-y-1 font-sans text-xs">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Maamulaha Machadka Codsaday:</p>
                    <p className="font-black text-slate-950 text-sm">{directorName}</p>
                    <p className="text-emerald-800 font-bold">Director General • Machadka Tahdiibul Adfaal</p>
                    <p className="font-mono text-[11px] text-slate-600">{contactEmail}</p>
                  </div>

                  {/* Official Digital Stamp Box */}
                  <div className="w-36 h-36 border-2 border-dashed border-[#0e7a48] rounded-full p-2 flex items-center justify-center text-center rotate-[-6deg] bg-emerald-50/50">
                    <div className="w-full h-full border border-[#0e7a48] rounded-full p-1 flex flex-col items-center justify-center text-[9px] font-black text-[#0e7a48] uppercase leading-tight font-sans">
                      <span>★ MACHADKA TAHDIIBUL ADFAAL ★</span>
                      <span className="text-amber-600 font-mono text-[8px] my-0.5">VERIFIED STAMP</span>
                      <span>MOGADISHU - SOMALIA</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('form')}
                  className="px-5 py-2.5 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300"
                >
                  U laabo Form-ka
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep('documents')}
                  className="px-6 py-3 bg-[#0e7a48] hover:bg-[#095733] text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <span>Gudbi & Qabso Dukumiintiyada (Next)</span>
                  <Upload className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: GUDBINTA DUKUMIINTIYADA (DOCUMENT UPLOAD) */}
          {activeStep === 'documents' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Dukumiintiyada Qasabka Ah Ee Looga Baahan Yahay Machadka</h3>
                    <p className="text-xs text-slate-500">Hubi in dhammaan afarta dukumiinti ee hoose ay ku qabsan yihiin codsigaaga.</p>
                  </div>
                </div>

                {/* Document Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Doc 1 */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="font-black text-xs text-slate-900 block">1. Warqadda Codsiga Rasmiga ah</span>
                        <span className="text-[10px] text-slate-500">Auto-Generated Letterhead</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Qabsan
                    </span>
                  </div>

                  {/* Doc 2 */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-amber-600" />
                      <div>
                        <span className="font-black text-xs text-slate-900 block">2. Shatiga Wasaaradda Waxbarashada</span>
                        <span className="text-[10px] text-slate-500">Educational License Scan</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Qabsan
                    </span>
                  </div>

                  {/* Doc 3 */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-black text-xs text-slate-900 block">3. Kaarka Aqoonsiga / Passport-ka Maamulaha</span>
                        <span className="text-[10px] text-slate-500">Director Identity Verification</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Qabsan
                    </span>
                  </div>

                  {/* Doc 4 */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#0e7a48]" />
                      <div>
                        <span className="font-black text-xs text-slate-900 block">4. Shahaadada Aqoonsiga Nidaamka</span>
                        <span className="text-[10px] text-slate-500">System Identification Certificate v4.5</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Qabsan
                    </span>
                  </div>

                </div>

                {/* FILE UPLOADER DROPZONE */}
                <div className="p-6 border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-2xl text-center space-y-3">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">Ku dar Dukumiinti Dheeraad ah (Scan / PDF / Image)</h4>
                    <p className="text-[11px] text-slate-500">Soo jiid ama guji si aad uga soo qaaddo kombuyuutarkaaga (PDF, PNG, JPG - Max 10MB)</p>
                  </div>
                  <label className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl inline-block cursor-pointer shadow-md transition-all">
                    <span>Soo Qaad File (Choose Files)</span>
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* UPLOADED FILES LIST */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Dukumiintiyada Hadda U Diyaar Ah Gudbinta ({uploadedFiles.length}):
                  </span>
                  <div className="space-y-1.5">
                    {uploadedFiles.map((f, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-800 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold">{f.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({f.size})</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                          {f.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ACTION SUBMIT BUTTON */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('letter_preview')}
                  className="px-5 py-2.5 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300"
                >
                  U laabo Warqadda Codsiga
                </button>

                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#0e7a48] hover:bg-[#095733] text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Gudbinayaa Codsiga...' : 'GUDBI CODSIGA & DUKUMIINTIYADA HORMUUD TELECOM'}</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: XAALADDA CODSIGA (SUBMISSION STATUS & TRACKING) */}
          {activeStep === 'submit_status' && (
            <div className="space-y-6 animate-fadeIn">
              
              {!submissionRecord ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-black text-slate-900 text-base">Weli Codsi Lama Gudbin</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Fadlan buuxi form-ka oo u gudbi dukumiintiyada Hormuud Telecom si aad u hesho Tracking Code-ka rasmiga ah.
                  </p>
                  <button
                    onClick={() => setActiveStep('form')}
                    className="px-6 py-2.5 bg-[#0e7a48] text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Biloow Codsiga Hada
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Status Banner Card */}
                  <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl border-2 border-emerald-500 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                            OFFICIAL TRACKING ACTIVE
                          </span>
                          <span className="text-amber-300 text-xs font-mono font-bold">
                            {submissionRecord.id}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight mt-1">
                          CODSIGA WAA LA GUDBIYAY (SUBMITTED TO HORMUUD)
                        </h3>
                      </div>

                      <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded-xl text-xs font-black font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>STATUS: {submissionRecord.status}</span>
                      </div>
                    </div>

                    {/* Progress Timeline Tracker */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                      
                      <div className="p-3 bg-white/10 rounded-xl border border-emerald-400/50 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-300 block">1. Gudbinta Codsiga</span>
                        <span className="font-black text-white block">✅ Full Completed</span>
                        <span className="text-[9px] text-slate-300 block">{submissionRecord.submissionDate}</span>
                      </div>

                      <div className="p-3 bg-white/10 rounded-xl border border-amber-400/50 space-y-1">
                        <span className="text-[10px] font-bold text-amber-300 block">2. Eegista Dukumiintiyada</span>
                        <span className="font-black text-amber-300 block">⏳ Under Review</span>
                        <span className="text-[9px] text-slate-300 block">Hormuud Compliance Team</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1 opacity-60">
                        <span className="text-[10px] font-bold text-slate-400 block">3. Ansixinta Sender ID</span>
                        <span className="font-black text-slate-300 block">Pending Approval</span>
                        <span className="text-[9px] text-slate-400 block">[{submissionRecord.requestedSenderId}]</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1 opacity-60">
                        <span className="text-[10px] font-bold text-slate-400 block">4. Soo Saarida Credentials</span>
                        <span className="font-black text-slate-300 block">API Key Active</span>
                        <span className="text-[9px] text-slate-400 block">Live Credentials</span>
                      </div>

                    </div>
                  </div>

                  {/* Submission Summary Details */}
                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">
                      Nuqulka Xogta Codsiga Ee Hormuud Telecom Loo Gudbiyay:
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[10px] block">Machadka:</span>
                        <span className="text-slate-900 font-bold">{submissionRecord.institutionName}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[10px] block">Maamulaha:</span>
                        <span className="text-slate-900 font-bold">{submissionRecord.directorName} ({submissionRecord.contactPhone})</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[10px] block">Sender ID Masking:</span>
                        <span className="text-[#0e7a48] font-mono font-black">[{submissionRecord.requestedSenderId}]</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[10px] block">Adeegyada La Codsaday:</span>
                        <span className="text-slate-800">{submissionRecord.servicesRequested.join(', ')}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-medium">
                      {submissionRecord.notes}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0e7a48]" />
            <span>Hormuud Telecom Compliance & API Verification Hub</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Xir (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
