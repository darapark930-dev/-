import React, { useState } from 'react';
import {
  Settings,
  Volume2,
  Bell,
  Code,
  Check,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Link,
  ShieldAlert,
} from 'lucide-react';
import { AppSettings } from '../types';
import { playChimeSound, speakMedicationAlert } from '../utils/audio';
import { GAS_SAMPLE_CODE, testGasConnection } from '../utils/gasSync';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingGas, setTestingGas] = useState(false);
  const [gasTestResult, setGasTestResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GAS_SAMPLE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestGas = async () => {
    if (!formData.gasUrl) return;
    setTestingGas(true);
    setGasTestResult(null);
    const res = await testGasConnection(formData.gasUrl);
    setGasTestResult(res.message);
    setTestingGas(false);
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('현재 브라우저에서는 데스크톱 알림을 지원하지 않습니다.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('스마트 약 복용 알림', {
        body: '알림이 성공적으로 활성화되었습니다! 정해진 복약 시간에 안내해 드립니다.',
        icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965567.png',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">환경설정 및 구글 연동</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          알림 방식, 복약자 이름, Google Apps Script 및 스프레드시트 연동 설정을 구성합니다.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">사용자 기본 정보</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              복약자 성함 / 호칭
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="예: 홍길동, 어머니, 아버님"
              className="w-full sm:w-80 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              음성 안내 시 "홍길동님, 비타민 복용 시간입니다" 형태로 친근하게 안내됩니다.
            </p>
          </div>
        </div>

        {/* Audio & Notification Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">알림 및 사운드 설정</h3>

          <div className="space-y-3">
            {/* Chime toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  복약 시간 오디오 차임벨 재생
                </span>
                <p className="text-xs text-slate-500">
                  Web Audio API로 합성된 편안하고 맑은 차임벨을 울립니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playChimeSound('alarm')}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  소리 테스트
                </button>
                <input
                  type="checkbox"
                  checked={formData.enableAudio}
                  onChange={(e) => setFormData({ ...formData, enableAudio: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* TTS Voice toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  한국어 음성(TTS) 복약 지도 알림
                </span>
                <p className="text-xs text-slate-500">
                  "비타민 D 복용 시간입니다. 식후 30분에 복용하세요" 음성으로 안내합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    speakMedicationAlert('비타민 D', '식후 30분 복용', formData.userName)
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  음성 테스트
                </button>
                <input
                  type="checkbox"
                  checked={formData.enableSpeech}
                  onChange={(e) => setFormData({ ...formData, enableSpeech: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Desktop notification */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  브라우저 바탕화면 알림 (Desktop Push)
                </span>
                <p className="text-xs text-slate-500">
                  다른 창을 보고 있을 때도 바탕화면 배너로 복용을 알려드립니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                알림 권한 허용
              </button>
            </div>
          </div>
        </div>

        {/* Google Apps Script Integration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Google Apps Script & 스프레드시트 연동
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  연동 준비 완료
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                복용 완료 기록을 Google 스프레드시트에 영구 보관할 수 있습니다.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Apps Script 웹 앱 URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={formData.gasUrl}
                onChange={(e) => setFormData({ ...formData, gasUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 font-mono text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleTestGas}
                disabled={testingGas}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors whitespace-nowrap"
              >
                {testingGas ? '연결 확인 중...' : '연결 테스트'}
              </button>
            </div>
            {gasTestResult && (
              <p className="text-xs mt-1.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {gasTestResult}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="syncToGas"
              checked={formData.syncToGas}
              onChange={(e) => setFormData({ ...formData, syncToGas: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="syncToGas" className="text-xs font-medium text-slate-700 cursor-pointer">
              복용 완료 시 Google 스프레드시트로 자동 실시간 기록 전송
            </label>
          </div>

          {/* Reference GAS Code Accordion */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-500" />
                Google Apps Script (Code.gs) 추천 코드
              </span>
              <button
                type="button"
                onClick={handleCopyGasCode}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>코드 복사</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
              {GAS_SAMPLE_CODE}
            </pre>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Google 스프레드시트 메뉴 &gt; 확장 프로그램 &gt; Apps Script에 위 코드를 붙여넣고 [웹 앱으로 배포]하면 연결됩니다.
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('샘플 데이터로 전체 초기화하시겠습니까? 현재 기록이 재설정됩니다.')) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 데이터로 초기화</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>저장 완료!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>설정 저장하기</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
