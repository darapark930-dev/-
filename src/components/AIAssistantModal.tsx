import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  MessageSquare,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  Send,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { Medication } from '../types';

interface AIAssistantProps {
  medications: Medication[];
  onAddParsedMeds: (meds: Partial<Medication>[]) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  medications,
  onAddParsedMeds,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'interaction' | 'qa' | 'ocr'>('interaction');

  // Interaction Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Q&A State
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string }>>([
    {
      q: '혈압약을 아침에 깜빡하고 안 먹었을 때는 어떻게 해야 하나요?',
      a: '혈압약 복용을 잊으셨다면, 생각난 즉시 1회분을 복용하시는 것이 일반적입니다. 단, 다음 복용 시간이 얼마 남지 않았다면(예: 반나절 이상 경과하여 다음 복용 시간이 가깝다면) 잊은 약은 건너뛰고 다음 정해진 시간에 1회분만 복용하세요. 절대 한 번에 2회분을 복용해서는 안 됩니다.',
    },
  ]);

  // Prescription Parsing State
  const [prescriptionText, setPrescriptionText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMeds, setParsedMeds] = useState<Partial<Medication>[]>([]);
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  // Run Drug Interaction Analysis
  const handleAnalyzeInteractions = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/ai/analyze-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.');
      }
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setAnalysisError(err.message || '분석 요청에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Q&A
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const currentQ = question.trim();
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ai/medication-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ,
          medications,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '답변 생성 실패');
      setQaHistory((prev) => [...prev, { q: currentQ, a: data.answer }]);
    } catch (err: any) {
      setQaHistory((prev) => [
        ...prev,
        {
          q: currentQ,
          a: `오류: ${err.message || '답변을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'}`,
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Parse Prescription Text
  const handleParseText = async () => {
    if (!prescriptionText.trim() || isParsing) return;
    setIsParsing(true);
    setParseMessage(null);

    try {
      const res = await fetch('/api/ai/parse-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prescriptionText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '파싱 실패');

      if (Array.isArray(data.medications) && data.medications.length > 0) {
        setParsedMeds(data.medications);
        setParseMessage(`${data.medications.length}개의 약물 정보를 추출했습니다.`);
      } else {
        setParseMessage('약물 정보를 찾지 못했습니다. 텍스트를 조금 더 명확히 입력해주세요.');
      }
    } catch (err: any) {
      setParseMessage(`오류: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyParsedMeds = () => {
    if (parsedMeds.length === 0) return;
    onAddParsedMeds(parsedMeds);
    setParsedMeds([]);
    setPrescriptionText('');
    setParseMessage('약 목록에 등록되었습니다!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-purple-700 via-indigo-700 to-blue-700 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">스마트 복약 AI 임상 가이드</h2>
            <p className="text-xs text-purple-100">
              Gemini 기반으로 내가 먹는 약들의 상호작용 분석, 음식 주의사항, 복약 Q&A를 지원합니다.
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/20 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('interaction')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'interaction'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-purple-100 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>약물 간 궁합 및 상호작용 검사</span>
          </button>
          <button
            onClick={() => setActiveSubTab('qa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'qa'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-purple-100 hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>약사 AI 1:1 상담</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ocr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'ocr'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-purple-100 hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>처방전 텍스트 자동 등록</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Interaction Analysis */}
      {activeSubTab === 'interaction' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                현재 등록된 약물 {medications.length}종 상호작용 종합 점검
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                등록된 약과 영양제를 함께 복용할 때의 충돌 여부 및 최적의 복용 간격을 분석합니다.
              </p>
            </div>

            <button
              onClick={handleAnalyzeInteractions}
              disabled={isAnalyzing || medications.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>상호작용 검사 실행</span>
                </>
              )}
            </button>
          </div>

          {/* Medication Badges */}
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            {medications.map((m) => (
              <span
                key={m.id}
                className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
              >
                {m.name} ({m.time})
              </span>
            ))}
          </div>

          {analysisError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{analysisError}</span>
            </div>
          )}

          {analysisResult ? (
            <div className="mt-4 p-5 rounded-2xl bg-purple-50/50 border border-purple-100 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
              {analysisResult}
            </div>
          ) : (
            !isAnalyzing && (
              <div className="text-center py-8 text-slate-400 text-xs">
                '상호작용 검사 실행' 버튼을 누르면 AI가 영양제와 처방약 간의 최적 복약 간격 및 주의사항을 안내합니다.
              </div>
            )
          )}
        </div>
      )}

      {/* Tab 2: Q&A */}
      {activeSubTab === 'qa' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">약사 AI 1:1 상담</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              약 복용 시기, 빠뜨렸을 때 대처법, 보관 방법 등 궁금한 점을 자유롭게 질문하세요.
            </p>
          </div>

          {/* Chat Messages */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {qaHistory.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm max-w-lg shadow-xs">
                    {item.q}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm max-w-xl whitespace-pre-wrap">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleAskQuestion} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="예: 위염약과 비타민을 같이 먹어도 되나요?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>질문하기</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: OCR / Prescription Text Parser */}
      {activeSubTab === 'ocr' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              처방전 / 복약 지도서 텍스트 빠른 등록
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              병원에서 받은 처방전 내용이나 약 봉투의 텍스트를 붙여넣으면 AI가 약 이름과 복용 일정을 추출해 등록합니다.
            </p>
          </div>

          <textarea
            rows={4}
            placeholder="예: 아침 식후 30분 아모디핀정 5mg 1정, 타이레놀 500mg 필요시 1회 1정 복용..."
            value={prescriptionText}
            onChange={(e) => setPrescriptionText(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setPrescriptionText(
                  '1. 가스모틴정 5mg (아침, 저녁 식전 30분 1정씩)\n2. 오메가3 1000mg (점심 식후 즉시 2캡슐)\n3. 마그네슘 (취침 30분 전 1정)'
                );
              }}
              className="text-xs text-purple-600 hover:underline"
            >
              샘플 텍스트 채우기
            </button>

            <button
              onClick={handleParseText}
              disabled={isParsing || !prescriptionText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>약품 정보 추출하기</span>
                </>
              )}
            </button>
          </div>

          {parseMessage && (
            <p className="text-xs text-slate-600 bg-purple-50 p-2.5 rounded-lg border border-purple-100">
              {parseMessage}
            </p>
          )}

          {parsedMeds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">추출된 약품 목록:</h4>
              <div className="space-y-2">
                {parsedMeds.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{med.name}</span>
                      <span className="text-slate-500 ml-2">({med.time}, {med.dosage})</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{med.memo}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleApplyParsedMeds}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>추출된 약품 내 목록에 일괄 추가하기</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
