import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Languages, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Compass, 
  Layers, 
  ArrowRightLeft, 
  Calculator,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Language, AppMode, ExperimentTrial } from './types';
import { L } from './i18n/translations';
import { Mode1Warmup } from './components/Mode1Warmup';
import { Mode2Discovery } from './components/Mode2Discovery';
import { Mode3Compare } from './components/Mode3Compare';
import { Mode4UnitConversion } from './components/Mode4UnitConversion';
import { Mode5Practice } from './components/Mode5Practice';
import { sounds } from './simulation/soundEffects';
import { runExpectedValueTests } from './simulation/physicsModel';

export default function App() {
  const [lang, setLang] = useState<Language>('vi');
  const [activeMode, setActiveMode] = useState<AppMode>('mode1_warmup');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [trials, setTrials] = useState<ExperimentTrial[]>([]);
  const [testResults, setTestResults] = useState<{ passed: boolean; details: string[] } | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const t = L[lang];

  // Self-QA Verification: Run Expected Value Tests (Section 24 & 26)
  useEffect(() => {
    const res = runExpectedValueTests();
    setTestResults(res);
  }, []);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playTick();
  };

  const handleSaveTrial = (newTrial: ExperimentTrial) => {
    setTrials((prev) => {
      // Limit to 4 experiments as stated in spec Section 7 (MODE 3)
      const next = [newTrial, ...prev.filter((p) => p.id !== newTrial.id)];
      return next.slice(0, 4);
    });
  };

  const handleRemoveTrial = (id: string) => {
    setTrials((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAllTrials = () => {
    setTrials([]);
  };

  const modes = [
    { id: 'mode1_warmup', label: t.mode1, icon: Trophy, color: 'text-amber-600' },
    { id: 'mode2_discovery', label: t.mode2, icon: Compass, color: 'text-blue-600' },
    { id: 'mode3_compare', label: t.mode3, icon: Layers, color: 'text-indigo-600' },
    { id: 'mode4_units', label: t.mode4, icon: ArrowRightLeft, color: 'text-emerald-600' },
    { id: 'mode5_practice', label: t.mode5, icon: Calculator, color: 'text-purple-600' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Project Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                    {t.appName}
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {t.gradeSubject}
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden md:block">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={handleSoundToggle}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Scientific QA badge */}
              {testResults && (
                <button
                  onClick={() => setShowTestModal(true)}
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-colors ${
                    testResults.passed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                  title="Kiểm định độ chính xác các bài toán kiểm chứng (Section 24)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chuẩn KHTN 7</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                <span>{lang === 'vi' ? 'EN' : 'VI'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Mode Tabs Bar */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 text-xs sm:text-sm">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMode(m.id as AppMode);
                    sounds.playTick();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : m.color}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Simulation View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeMode === 'mode1_warmup' && <Mode1Warmup lang={lang} />}
        {activeMode === 'mode2_discovery' && <Mode2Discovery lang={lang} onSaveTrial={handleSaveTrial} />}
        {activeMode === 'mode3_compare' && (
          <Mode3Compare
            lang={lang}
            trials={trials}
            onSetTrials={setTrials}
            onRemoveTrial={handleRemoveTrial}
            onClearAll={handleClearAllTrials}
          />
        )}
        {activeMode === 'mode4_units' && <Mode4UnitConversion lang={lang} />}
        {activeMode === 'mode5_practice' && <Mode5Practice lang={lang} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-2">
          <span>
            {t.appName} • KHTN/Vật lí lớp 7 • Bài 8: Tốc độ chuyển động (SPEC V7.0)
          </span>
          <span className="font-mono text-slate-400">
            v = s / t • 1 m/s = 3,6 km/h
          </span>
        </div>
      </footer>

      {/* Expected Values Verification Modal */}
      {showTestModal && testResults && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Kiểm chứng bộ số liệu chuẩn (Section 24)
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Các giá trị khoa học được quy định trong SPEC V7.0 Bài 8 đã được hệ thống tự động kiểm tra:
            </p>

            <div className="space-y-1.5 font-mono text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
              {testResults.details.map((line, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded flex items-center justify-between ${
                    line.includes('PASS')
                      ? 'text-emerald-700 bg-emerald-50/60'
                      : 'text-rose-700 bg-rose-50/60'
                  }`}
                >
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
