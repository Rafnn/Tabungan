/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import foto1 from './foto1.jpg';
import foto2 from './foto2.jpg';
import foto3 from './foto3.jpg';

interface DepositRecord {
  id: string;
  partner: 'rafly' | 'salfa';
  partnerName: string;
  amount: number;
  date: string;
  method: string;
  account: string;
  receiptName?: string;
  receiptUrl?: string;
  timestamp: number;
}

const INITIAL_RECORDS: DepositRecord[] = [
  {
    id: 'dep-1',
    partner: 'rafly',
    partnerName: 'Rafly',
    amount: 3000000,
    date: '18 Maret 2025',
    method: 'SeaBank Rekening Bersama',
    account: '9012 8847 2910',
    timestamp: Date.now() - 6 * 86400000,
  },
  {
    id: 'dep-2',
    partner: 'salfa',
    partnerName: 'Salfa',
    amount: 2500000,
    date: '10 Maret 2025',
    method: 'BCA Virtual Account',
    account: '8801 2948 1029 384',
    timestamp: Date.now() - 14 * 86400000,
  },
  {
    id: 'dep-3',
    partner: 'rafly',
    partnerName: 'Rafly',
    amount: 5000000,
    date: '28 Februari 2025',
    method: 'Mandiri Virtual Account',
    account: '8950 8294 1120 491',
    timestamp: Date.now() - 25 * 86400000,
  },
];

const TARGET_AMOUNT = 80000000; // Rp 80 Juta

const BANK_DATA = {
  seabank: {
    key: 'seabank',
    name: 'SeaBank Rekening Bersama',
    number: '9012 8847 2910',
    code: 'SeaBank',
    tag: 'Utama',
    tagColor: 'text-[#35644b]',
    color: 'text-orange-600',
    holder: 'Kas Bersama Rafly & Salfa',
    badge: 'Bebas Biaya',
    desc: 'Verifikasi otomatis & instan',
  },
  bca: {
    key: 'bca',
    name: 'BCA Virtual Account',
    number: '8801 2948 1029 384',
    code: 'BCA',
    tag: 'VA',
    tagColor: 'text-[#414943]',
    color: 'text-blue-700',
    holder: 'Tabungan Rafly & Salfa',
    badge: 'Bebas Biaya',
    desc: 'Verifikasi instan 24/7',
  },

};

const EWALLET_DATA = [

  {
    id: 'ShopeePay',
    name: 'ShopeePay',
    tag: 'Instan 1-Tap',
    tagColor: 'text-[#717973]',
    icon: 'shopping_bag',
    iconBg: 'bg-orange-50 text-orange-600',
    phone: '0812-9981-2244',
  },
  {
    id: 'DANA',
    name: 'DANA',
    tag: 'Bebas Transfer',
    tagColor: 'text-[#717973]',
    icon: 'send_to_mobile',
    iconBg: 'bg-blue-50 text-blue-600',
    phone: '0812-9981-2244',
  },
];

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function App() {
  // Screen mode: 'form' (default matches screenshot) or 'ledger' (view kas buku)
  const [currentView, setCurrentView] = useState<'form' | 'ledger'>('form');

  // Form states
  const [activePartner, setActivePartner] = useState<'rafly' | 'salfa'>('rafly');
  const [amountStr, setAmountStr] = useState<string>('2.500.000');
  const [activePaymentMethod, setActivePaymentMethod] = useState<'bank' | 'ewallet'>('bank');
  const [activeBankKey, setActiveBankKey] = useState<keyof typeof BANK_DATA>('seabank');
  const [activeEwallet, setActiveEwallet] = useState<string>('GoPay');
  
  // Date states
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('2025-03-24');
  const [selectedFormattedDate, setSelectedFormattedDate] = useState<string>('24 Maret 2025');

  // Upload states
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  // Modal & Toast states
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copyButtonLabel, setCopyButtonLabel] = useState<string>('Salin');

  // Deposit history & records
  const [deposits, setDeposits] = useState<DepositRecord[]>(INITIAL_RECORDS);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Number helpers
  const parseAmount = (str: string): number => {
    const cleaned = str.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const formatIDR = (num: number): string => {
    return num.toLocaleString('id-ID');
  };

  const currentNumericAmount = parseAmount(amountStr);

  // Toast trigger
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Date handlers
  const handleDateChange = (isoValue: string) => {
    setSelectedIsoDate(isoValue);
    if (!isoValue) return;
    const parts = isoValue.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const label = `${day} ${MONTH_NAMES_ID[monthIdx] || parts[1]} ${year}`;
      setSelectedFormattedDate(label);
      showToast(`Tanggal setoran: ${label}`);
    }
  };

  const setQuickDateToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    handleDateChange(iso);
  };

  const openNativeDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    try {
      if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
        (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
      } else {
        input.focus();
        input.click();
      }
    } catch {
      input.focus();
      input.click();
    }
  };

  // Amount handlers
  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const num = parseAmount(rawVal);
    setAmountStr(num ? formatIDR(num) : '');
  };

  const handleAddPreset = (val: number) => {
    const current = parseAmount(amountStr);
    const updated = current + val;
    setAmountStr(formatIDR(updated));
    showToast(`+Rp ${formatIDR(val)} ditambahkan`);
  };

  const handleClearAmount = () => {
    setAmountStr('');
  };

  // Copy VA
  const handleCopyVa = () => {
    const activeBank = BANK_DATA[activeBankKey];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeBank.number.replace(/\s+/g, '')).catch(() => {});
    }
    setCopyButtonLabel('Tersalin!');
    showToast('Nomor rekening berhasil disalin!');
    setTimeout(() => {
      setCopyButtonLabel('Salin');
    }, 2000);
  };

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedFile({
          name: file.name,
          url: ev.target?.result as string,
        });
        showToast('Bukti screenshot m-banking terpilih!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Bukti transfer dihapus');
  };

  // Confetti launcher
  const launchConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const colors = ['#35644b', '#fe9572', '#bbeecf', '#99462a', '#ffd700', '#ffffff'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      isHeart: boolean;
      opacity: number;
    }> = [];

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() * 80 - 40),
        y: height * 0.7,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 16 - 7,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        isHeart: Math.random() > 0.65,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity > 0 && p.y < height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.isHeart) {
            ctx.beginPath();
            const topCurveHeight = p.size * 0.3;
            ctx.moveTo(0, topCurveHeight);
            ctx.bezierCurveTo(0, 0, -p.size / 2, 0, -p.size / 2, topCurveHeight);
            ctx.bezierCurveTo(-p.size / 2, (p.size + topCurveHeight) / 2, 0, p.size, 0, p.size);
            ctx.bezierCurveTo(0, p.size, p.size / 2, (p.size + topCurveHeight) / 2, p.size / 2, topCurveHeight);
            ctx.bezierCurveTo(p.size / 2, 0, 0, 0, 0, topCurveHeight);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5);
          }
          ctx.restore();
        }
      }

      if (alive) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };
    render();
  };

  // Submit Save Deposit
  const handleSaveDeposit = () => {
    const finalAmount = currentNumericAmount > 0 ? currentNumericAmount : 2500000;
    const activeBank = BANK_DATA[activeBankKey];
    const methodName = activePaymentMethod === 'bank' ? activeBank.name : `E-Wallet (${activeEwallet})`;
    const accountNum = activePaymentMethod === 'bank' ? activeBank.number : '0812-9981-2244';

    const newRecord: DepositRecord = {
      id: `dep-${Date.now()}`,
      partner: activePartner,
      partnerName: activePartner === 'rafly' ? 'Rafly' : 'Salfa',
      amount: finalAmount,
      date: selectedFormattedDate,
      method: methodName,
      account: accountNum,
      receiptName: uploadedFile?.name,
      receiptUrl: uploadedFile?.url,
      timestamp: Date.now(),
    };

    setDeposits((prev) => [newRecord, ...prev]);
    launchConfetti();
    setShowSuccessModal(true);
  };

  // Reset form for next entry
  const resetForm = () => {
    setShowSuccessModal(false);
    setAmountStr('2.500.000');
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Siap mencatat setoran baru');
  };

  // Total calculation for joint savings progress
  const totalSaved = deposits.reduce((acc, curr) => acc + curr.amount, 0) + 52000000; // includes base initial balance
  const raflySaved = deposits.filter((d) => d.partner === 'rafly').reduce((acc, curr) => acc + curr.amount, 0) + 28000000;
  const salfaSaved = deposits.filter((d) => d.partner === 'salfa').reduce((acc, curr) => acc + curr.amount, 0) + 24000000;
  const targetPercent = Math.min(100, Math.round((totalSaved / TARGET_AMOUNT) * 100));

  return (
    <div className="min-h-screen bg-[#fff8f6] font-['Plus_Jakarta_Sans'] text-[#1e1b1a] antialiased flex flex-col selection:bg-[#bbeecf] selection:text-[#002112]">
      {/* Interactive Canvas for Confetti */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[120] w-full h-full"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[130] flex items-center gap-2 bg-[#33302f] text-[#f7efed] px-4 py-2.5 rounded-full shadow-lg text-[13px] font-medium transition-all duration-300">
          <span className="material-symbols-outlined text-[#bbeecf] text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#fff8f6]/85 backdrop-blur-xl pt-safe shadow-[0_1px_12px_rgba(30,27,26,0.03)] border-b border-[#e8e1df]/40">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              aria-label="Kembali"
              className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-[#1e1b1a] hover:bg-[#f4ecea] active:scale-95 transition-all shrink-0 cursor-pointer"
              onClick={() => {
                if (currentView === 'ledger') {
                  setCurrentView('form');
                } else {
                  setShowCloseModal(true);
                }
              }}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
            </button>
            <img
              alt="Tabungan Berdua Logo"
              className="h-7 w-auto object-contain shrink-0"
              src={foto3}
            />
            <div className="flex flex-col min-w-0">
              <h1 className="text-[17px] font-semibold text-[#1e1b1a] truncate leading-tight">
                {currentView === 'form' ? 'Tambah Setoran' : 'Buku Kas Bersama'}
              </h1>
              <span className="text-[11px] text-[#717973] truncate leading-none">
                Tabungan Berdua
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View switcher shortcut */}
            <button
              onClick={() => setCurrentView(currentView === 'form' ? 'ledger' : 'form')}
              className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#f4ecea] text-[#414943] hover:bg-[#e8e1df] transition-all flex items-center gap-1 cursor-pointer"
              title={currentView === 'form' ? 'Lihat Kas Bersama' : 'Form Setoran'}
            >
              <span className="material-symbols-outlined text-[15px] text-[#35644b]">
                {currentView === 'form' ? 'account_balance' : 'add_circle'}
              </span>
              <span>{currentView === 'form' ? 'Buku Kas' : 'Setor'}</span>
            </button>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#35644b] flex items-center justify-center shrink-0 shadow-xs text-white">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-12 bg-[#fff8f6] px-4 max-w-md mx-auto">
        {currentView === 'ledger' ? (
          /* Ledger & Savings Overview View */
          <div className="flex flex-col gap-4 mt-2">
            {/* Top Overview Card */}
            <div className="bg-white rounded-3xl p-5 shadow-xl border border-[#e8e1df]/70 flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#35644b] tracking-wider uppercase">
                    Pernikahan & Rumah Pertama
                  </span>
                  <h2 className="text-[22px] font-bold text-[#1e1b1a]">Kas Tabungan Bersama</h2>
                </div>
                <button
                  onClick={() => setCurrentView('form')}
                  className="px-3 py-1.5 rounded-full bg-[#35644b] text-white text-[12px] font-bold flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Setor
                </button>
              </div>

              {/* Progress Summary */}
              <div className="bg-[#faf2f0] p-4 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-[#717973]">Terkumpul</span>
                  <span className="text-[20px] font-bold text-[#35644b]">
                    Rp {formatIDR(totalSaved)}
                  </span>
                </div>
                <div className="w-full bg-[#e8e1df] h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#35644b] h-full transition-all duration-500"
                    style={{ width: `${(raflySaved / TARGET_AMOUNT) * 100}%` }}
                    title="Rafly (Sage)"
                  />
                  <div
                    className="bg-[#99462a] h-full transition-all duration-500"
                    style={{ width: `${(salfaSaved / TARGET_AMOUNT) * 100}%` }}
                    title="Salfa (Terracotta)"
                  />
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-[#35644b] font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#35644b]"></span>
                    Rafly: Rp {formatIDR(raflySaved)}
                  </span>
                  <span className="text-[#99462a] font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#99462a]"></span>
                    Salfa: Rp {formatIDR(salfaSaved)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-[#717973]">
                  Target: Rp {formatIDR(TARGET_AMOUNT)} ({targetPercent}%)
                </div>
              </div>
            </div>

            {/* List of Transactions */}
            <div className="bg-white rounded-3xl p-5 shadow-xl border border-[#e8e1df]/70 flex flex-col gap-3">
              <h3 className="text-[16px] font-bold text-[#1e1b1a]">Riwayat Setoran Terbaru</h3>
              <div className="flex flex-col divide-y divide-[#f4ecea]">
                {deposits.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[13px] ${
                          item.partner === 'rafly' ? 'bg-[#35644b]' : 'bg-[#99462a]'
                        }`}
                      >
                        {item.partnerName.slice(0, 1)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-[#1e1b1a]">
                          {item.partnerName}
                        </span>
                        <span className="text-[11px] text-[#717973]">{item.date} · {item.method}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] font-bold text-[#35644b]">
                        +Rp {formatIDR(item.amount)}
                      </span>
                      <span className="text-[10px] text-[#35644b] bg-[#bbeecf]/50 px-1.5 py-0.5 rounded-full font-semibold">
                        Berhasil
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Form View: Exact replica of the uploaded screenshot & HTML spec */
          <div className="flex flex-col w-full pb-8">
            {/* Modal / Floating Sheet Container */}
            <div className="w-full bg-white rounded-3xl p-5 shadow-xl flex flex-col gap-5 relative overflow-hidden transition-all duration-300 border border-[#e8e1df]/50">
              {/* Top Decorative Ambient Glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#bbeecf]/40 blur-2xl pointer-events-none" />
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#ffdbd0]/50 blur-2xl pointer-events-none" />

              {/* 1. Header Form */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#35644b] tracking-wider uppercase font-semibold">
                    KOMITMEN BERSAMA
                  </span>
                  <h2 className="text-[20px] font-semibold text-[#1e1b1a]">
                    Tambah Setoran Baru
                  </h2>
                </div>
                <button
                  aria-label="Tutup formulir"
                  className="w-9 h-9 rounded-full bg-[#eee7e5] text-[#414943] flex items-center justify-center hover:bg-[#e8e1df] active:scale-95 transition-all cursor-pointer"
                  onClick={() => setShowCloseModal(true)}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* 2. Dual Avatar Selector (Penyetor: Rafly / Salfa) */}
              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[12px] font-medium text-[#414943] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#35644b]">group</span>
                  Siapa yang menyetor kali ini?
                </label>
                <div className="grid grid-cols-2 gap-3" id="partner-selector">
                  {/* Rafly (Sage Team) */}
                  <div
                    onClick={() => {
                      setActivePartner('rafly');
                      showToast('Penyetor dipilih: Rafly');
                    }}
                    className={`cursor-pointer relative flex items-center gap-3 p-3 rounded-2xl bg-[#faf2f0] transition-all duration-200 shadow-sm ${
                      activePartner === 'rafly'
                        ? 'ring-2 ring-[#35644b]'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                      <img
                        alt="Foto profil Rafly"
                        className="w-full h-full object-cover"
                        src={foto2}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[14px] font-semibold text-[#1e1b1a] truncate">Rafly</span>
                      <span className="text-[11px] text-[#35644b] font-medium flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#35644b] inline-block" />
                        Sage Team
                      </span>
                    </div>
                    {activePartner === 'rafly' && (
                      <div className="w-5 h-5 rounded-full bg-[#35644b] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    )}
                  </div>

                  {/* Salfa (Terracotta) */}
                  <div
                    onClick={() => {
                      setActivePartner('salfa');
                      showToast('Penyetor dipilih: Salfa');
                    }}
                    className={`cursor-pointer relative flex items-center gap-3 p-3 rounded-2xl bg-[#faf2f0] transition-all duration-200 shadow-sm ${
                      activePartner === 'salfa'
                        ? 'ring-2 ring-[#99462a]'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                      <img
                        alt="Foto profil Salfa"
                        className="w-full h-full object-cover"
                        src={foto1}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[14px] font-semibold text-[#1e1b1a] truncate">Salfa</span>
                      <span className="text-[11px] text-[#99462a] font-medium flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#99462a] inline-block" />
                        Terracotta
                      </span>
                    </div>
                    {activePartner === 'salfa' && (
                      <div className="w-5 h-5 rounded-full bg-[#99462a] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Input Nominal Setoran & Preset Quick Chips */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[12px] font-medium text-[#414943] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#35644b]">
                      payments
                    </span>
                    Nominal Tabungan
                  </span>
                  <span className="text-[11px] font-semibold text-[#35644b]">
                    Target Bersama: Rp 80jt
                  </span>
                </label>

                {/* Big Display Input Container */}
                <div className="bg-[#faf2f0] rounded-2xl p-3.5 flex flex-col gap-1 transition-all focus-within:bg-[#f4ecea] focus-within:ring-2 focus-within:ring-[#35644b]/40">
                  <span className="text-[11px] text-[#717973]">Jumlah Setoran (IDR)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] text-[#717973] font-semibold select-none">
                      Rp
                    </span>
                    <input
                      className="w-full bg-transparent text-[24px] text-[#1e1b1a] focus:outline-none placeholder:text-[#717973] font-bold tracking-tight"
                      id="amount-input"
                      value={amountStr}
                      onChange={handleAmountInput}
                      placeholder="0"
                      type="text"
                    />
                    <button
                      aria-label="Hapus nominal"
                      className="p-1 rounded-full text-[#717973] hover:text-[#1e1b1a] hover:bg-[#eee7e5] transition-colors cursor-pointer"
                      onClick={handleClearAmount}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">backspace</span>
                    </button>
                  </div>
                </div>

                {/* Quick Chips Presets */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {[
                    { label: '+Rp 500rb', value: 500000 },
                    { label: '+Rp 1jt', value: 1000000 },
                    { label: '+Rp 2jt', value: 2000000 },
                    { label: '+Rp 5jt', value: 5000000 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      className="px-3 py-1.5 rounded-full bg-[#f4ecea] text-[12px] font-medium text-[#1e1b1a] hover:bg-[#bbeecf] hover:text-[#002112] active:scale-95 transition-all whitespace-nowrap shadow-xs cursor-pointer"
                      onClick={() => handleAddPreset(chip.value)}
                      type="button"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Pilihan Tanggal Setor */}
              <div className="flex flex-col gap-2">
                <div
                  className="relative flex items-center justify-between bg-[#faf2f0] px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[#f4ecea] active:scale-[0.99] transition-all border border-[#c0c9c1]/40"
                  onClick={openNativeDatePicker}
                >
                  <div className="flex items-center gap-2 text-[#1e1b1a] pointer-events-none">
                    <span className="material-symbols-outlined text-[18px] text-[#35644b]">
                      calendar_today
                    </span>
                    <span className="text-[14px] font-medium">Tanggal Setor</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-xs pointer-events-none border border-[#c0c9c1]/20">
                    <span className="text-[12px] font-medium text-[#1e1b1a]">
                      {selectedFormattedDate}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#717973]">
                      expand_more
                    </span>
                  </div>
                  {/* Invisible native date picker covering the trigger */}
                  <input
                    ref={dateInputRef}
                    aria-label="Pilih tanggal setor"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    onChange={(e) => handleDateChange(e.target.value)}
                    type="date"
                    value={selectedIsoDate}
                  />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#717973]">
                    <span className="material-symbols-outlined text-[13px] text-[#35644b]">
                      event_available
                    </span>
                    <span>Ketuk untuk memilih tanggal kapan saja</span>
                  </div>
                  <button
                    className="text-[11px] text-[#35644b] font-semibold hover:underline cursor-pointer"
                    onClick={setQuickDateToday}
                    type="button"
                  >
                    Set Hari Ini
                  </button>
                </div>
              </div>

              {/* 5. METODE PEMBAYARAN */}
              <div className="flex flex-col gap-3 rounded-2xl bg-[#faf2f0]/70 border border-[#c0c9c1]/40 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#414943] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#35644b]">
                      account_balance_wallet
                    </span>
                    <span>Metode Pembayaran (Pilih Cara Menabung)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#35644b] bg-[#bbeecf]/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">verified</span> Otomatis
                  </span>
                </div>

                {/* Tab Switcher (Transfer VA & E-Wallet) */}
                <div className="grid gap-1.5 bg-[#eee7e5]/60 p-1 rounded-xl grid-cols-2">
                  <button
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-center text-[12px] transition-all cursor-pointer ${
                      activePaymentMethod === 'bank'
                        ? 'bg-white text-[#35644b] shadow-xs font-semibold'
                        : 'text-[#414943] font-medium hover:text-[#1e1b1a]'
                    }`}
                    onClick={() => setActivePaymentMethod('bank')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    <span>Transfer VA / Bank</span>
                  </button>
                  <button
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-center text-[12px] transition-all cursor-pointer ${
                      activePaymentMethod === 'ewallet'
                        ? 'bg-white text-[#35644b] shadow-xs font-semibold'
                        : 'text-[#414943] font-medium hover:text-[#1e1b1a]'
                    }`}
                    onClick={() => setActivePaymentMethod('ewallet')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">smartphone</span>
                    <span>E-Wallet</span>
                  </button>
                </div>

                {/* TAB 1: TRANSFER BANK / VIRTUAL ACCOUNT */}
                {activePaymentMethod === 'bank' ? (
                  <div className="flex flex-col gap-3 transition-opacity duration-200">
                    <div className="flex flex-col gap-2">
                      <span className="text-[12px] font-medium text-[#414943]">
                        Pilih Bank Rekening Kas:
                      </span>
                      {/* Bank Grid Selector */}
                      <div className="grid grid-cols-4 gap-2">
                        {Object.values(BANK_DATA).map((b) => {
                          const isSelected = activeBankKey === b.key;
                          return (
                            <button
                              key={b.key}
                              className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'ring-2 ring-[#35644b] bg-white'
                                  : 'bg-white hover:bg-[#f4ecea]'
                              }`}
                              onClick={() => {
                                setActiveBankKey(b.key as keyof typeof BANK_DATA);
                                showToast(`Bank dipilih: ${b.code}`);
                              }}
                              type="button"
                            >
                              <span className={`font-bold text-xs tracking-tight ${b.color}`}>
                                {b.code}
                              </span>
                              <span className={`text-[10px] font-medium ${b.tagColor}`}>
                                {b.tag}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Bank Account Box */}
                    <div className="bg-white rounded-2xl p-4 border border-[#c0c9c1]/60 shadow-xs flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#c0c9c1]/30 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 rounded-lg bg-orange-50 flex items-center justify-center font-bold text-xs text-orange-600 border border-orange-200">
                            {BANK_DATA[activeBankKey].code}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] text-[#1e1b1a] font-semibold">
                              {BANK_DATA[activeBankKey].name}
                            </span>
                            <span className="text-[11px] text-[#717973]">
                              {BANK_DATA[activeBankKey].desc}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#35644b] bg-[#bbeecf]/60 px-2 py-0.5 rounded-full">
                          {BANK_DATA[activeBankKey].badge}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-[#717973]">
                          Nomor Rekening / Virtual Account
                        </span>
                        <div className="flex items-center justify-between bg-[#faf2f0] px-3.5 py-2.5 rounded-xl">
                          <span className="font-mono font-bold text-base tracking-wider text-[#1e1b1a]">
                            {BANK_DATA[activeBankKey].number}
                          </span>
                          <button
                            className="text-[#35644b] hover:text-[#4e7d63] text-[12px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#bbeecf]/60 active:scale-95 transition-all cursor-pointer"
                            onClick={handleCopyVa}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            <span>{copyButtonLabel}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-[#717973]">Atas Nama</span>
                        <span className="font-semibold text-[#1e1b1a]">
                          {BANK_DATA[activeBankKey].holder}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-[#717973]">Total Disetor</span>
                        <span className="font-bold text-[#35644b] text-base">
                          Rp {formatIDR(currentNumericAmount > 0 ? currentNumericAmount : 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: E-WALLET */
                  <div className="flex flex-col gap-3 transition-opacity duration-200">
                    <div className="grid grid-cols-2 gap-2.5">
                      {EWALLET_DATA.map((ew) => {
                        const isSelected = activeEwallet === ew.id;
                        return (
                          <button
                            key={ew.id}
                            className={`p-3 rounded-2xl bg-white shadow-xs flex items-center gap-3 text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-2 border-[#35644b]'
                                : 'border border-[#c0c9c1]/60 hover:bg-[#faf2f0]'
                            }`}
                            onClick={() => {
                              setActiveEwallet(ew.id);
                              showToast(`Metode pembayaran dipilih: ${ew.name}`);
                            }}
                            type="button"
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${ew.iconBg}`}
                            >
                              <span className="material-symbols-outlined text-[22px]">
                                {ew.icon}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] text-[#1e1b1a] font-semibold truncate">
                                {ew.name}
                              </span>
                              <span className={`text-[11px] font-medium ${ew.tagColor}`}>
                                {ew.tag}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* E-Wallet Action Box */}
                    <div className="bg-white rounded-2xl p-3.5 border border-[#c0c9c1]/40 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] text-[#1e1b1a] font-semibold">
                            Bayar lewat {activeEwallet}
                          </span>
                          <span className="text-[11px] text-[#717973]">
                            No. Terdaftar: 0812-9981-2244 (Rafly & Salfa)
                          </span>
                        </div>
                        <button
                          className="px-3.5 py-2 rounded-xl bg-[#35644b] text-white text-[12px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                          onClick={() => showToast(`Membuka aplikasi ${activeEwallet}...`)}
                          type="button"
                        >
                          <span>Buka App</span>
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[14px] pt-1 border-t border-[#c0c9c1]/30">
                        <span className="text-[#717973]">Total Bayar</span>
                        <span className="font-bold text-[#35644b]">
                          Rp {formatIDR(currentNumericAmount > 0 ? currentNumericAmount : 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Upload Bukti Transfer */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#414943] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#35644b]">
                      receipt_long
                    </span>
                    Bukti Transfer / M-Banking
                  </label>
                  <span className="text-[11px] text-[#717973]">JPG/PNG (Opsional)</span>
                </div>

                {/* Hidden native file input */}
                <input
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  type="file"
                />

                {/* Aesthetic Upload Drop Zone */}
                <div
                  className="cursor-pointer bg-[#faf2f0] hover:bg-[#f4ecea] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all group border border-dashed border-[#c0c9c1]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!uploadedFile ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white text-[#35644b] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[22px]">
                          add_photo_alternate
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-[#1e1b1a] font-semibold">
                          Upload screenshot m-banking
                        </span>
                        <span className="text-[11px] text-[#717973]">
                          Sentuh untuk memilih berkas dari galeri
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Filled state */
                    <div className="flex items-center justify-between w-full bg-white p-2.5 rounded-xl border border-[#c0c9c1]/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f4ecea] flex items-center justify-center shrink-0 border border-[#c0c9c1]/40">
                          <img
                            alt="Preview bukti"
                            className="w-full h-full object-cover"
                            src={uploadedFile.url}
                          />
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-[12px] text-[#1e1b1a] truncate font-semibold">
                            {uploadedFile.name}
                          </span>
                          <span className="text-[11px] text-[#35644b] font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              check_circle
                            </span>
                            Siap disimpan
                          </span>
                        </div>
                      </div>
                      <button
                        aria-label="Hapus file"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#717973] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                        onClick={handleRemoveFile}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Notifikasi Preview Banner & Tombol Simpan Selebrasi */}
              <div className="flex flex-col gap-3 pt-2">
                {/* Notification preview badge */}
                <div className="flex items-center gap-3 bg-[#ffdbd0]/40 p-3 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-[#99462a] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">
                      notifications_active
                    </span>
                  </div>
                  <p className="text-[13px] text-[#390b00] leading-tight">
                    <span className="font-semibold text-[#1e1b1a]">
                      {activePartner === 'rafly' ? 'Salfa' : 'Rafly'}
                    </span>{' '}
                    akan mendapatkan notifikasi manis begitu kamu menyimpan setoran ini! ✨
                  </p>
                </div>

                {/* Primary Action Button */}
                <button
                  className="w-full py-4 px-6 rounded-full bg-[#35644b] hover:bg-[#4e7d63] text-white text-[14px] font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                  id="save-button"
                  onClick={handleSaveDeposit}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">celebration</span>
                  <span>Bayar & Simpan Setoran 🎉</span>
                </button>

                {/* Subtle guarantee */}
                <div className="flex items-center justify-center gap-1.5 text-[#717973]">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span className="text-[11px]">
                    Tercatat aman & transparan di buku kas bersama
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success Celebration Dialog Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[#1e1b1a]/40 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-[#c0c9c1]/40 shadow-2xl flex flex-col items-center text-center gap-4 transform transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#bbeecf] flex items-center justify-center text-[#35644b] shadow-sm animate-bounce">
              <span className="material-symbols-outlined text-[36px]">favorite</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[20px] text-[#1e1b1a] font-bold">Luar Biasa, Cinta! 🎉</h3>
              <p className="text-[14px] text-[#414943]">
                Setoran Rp {formatIDR(currentNumericAmount > 0 ? currentNumericAmount : 2500000)} oleh{' '}
                {activePartner === 'rafly' ? 'Rafly' : 'Salfa'} berhasil ditambahkan ke Kas Bersama!
              </p>
            </div>

            {/* Progress Details Card */}
            <div className="w-full bg-[#faf2f0] p-3.5 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#1e1b1a] text-[12px]">
                <span>Penyetor</span>
                <span className="font-semibold text-[#35644b]">
                  {activePartner === 'rafly' ? 'Rafly (Sage Team)' : 'Salfa (Terracotta)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#1e1b1a] text-[12px]">
                <span>Metode Bayar</span>
                <span className="font-semibold text-[#1e1b1a]">
                  {activePaymentMethod === 'bank'
                    ? `${BANK_DATA[activeBankKey].code} (${BANK_DATA[activeBankKey].number})`
                    : `E-Wallet ${activeEwallet}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#1e1b1a] text-[12px] border-t border-[#c0c9c1]/40 pt-2">
                <span>Progres Target Bersama</span>
                <span className="text-[#35644b] font-bold">{targetPercent}%</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-2">
              <button
                className="w-full py-3 bg-[#35644b] hover:bg-[#4e7d63] text-white rounded-full text-[14px] font-semibold active:scale-95 transition-all shadow-sm cursor-pointer"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCurrentView('ledger');
                }}
              >
                Lihat Buku Kas Bersama
              </button>
              <button
                className="w-full py-2 text-[#717973] hover:text-[#1e1b1a] text-[12px] transition-colors cursor-pointer"
                onClick={resetForm}
              >
                Tambah Setoran Lainnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel / Close Confirm Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[#1e1b1a]/40 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-xs bg-white p-5 rounded-3xl border border-[#c0c9c1]/40 shadow-2xl flex flex-col items-center text-center gap-3.5 transform transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">cancel</span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-[18px] text-[#1e1b1a] font-bold">Batalkan Setoran?</h4>
              <p className="text-[13px] text-[#717973]">
                Perubahan nominal dan data setoran ini tidak akan disimpan.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                className="flex-1 py-2.5 rounded-full bg-[#f4ecea] hover:bg-[#eee7e5] text-[#1e1b1a] text-[12px] font-semibold transition-all active:scale-95 cursor-pointer"
                onClick={() => setShowCloseModal(false)}
              >
                Lanjut Menabung
              </button>
              <button
                className="flex-1 py-2.5 rounded-full bg-[#ba1a1a] text-white text-[12px] font-semibold transition-all active:scale-95 cursor-pointer"
                onClick={() => {
                  setShowCloseModal(false);
                  setCurrentView('ledger');
                }}
              >
                Ya, Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
