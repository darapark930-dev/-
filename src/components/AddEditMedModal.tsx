import React, { useState, useEffect } from 'react';
import { X, Clock, Pill, Check, Tag, ShieldAlert } from 'lucide-react';
import { Medication, MedicationCategory } from '../types';

interface AddEditMedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Partial<Medication>) => void;
  editingMed?: Medication | null;
}

const TIME_PRESETS = [
  { label: '아침 공복', time: '07:00' },
  { label: '아침 식후', time: '08:30' },
  { label: '점심 식후', time: '13:00' },
  { label: '저녁 식후', time: '19:30' },
  { label: '취침 전', time: '22:00' },
];

const MEMO_PRESETS = [
  '식후 30분, 물 1컵과 함께',
  '식사 직후 복용',
  '기상 직후 공복 복용',
  '취침 30분 전 복용',
  '충분한 물과 함께 복용',
  '유제품과 2시간 간격 유지',
];

const COLOR_OPTIONS = [
  { id: 'blue', label: '블루', bg: 'bg-blue-500' },
  { id: 'emerald', label: '그린', bg: 'bg-emerald-500' },
  { id: 'amber', label: '옐로우', bg: 'bg-amber-500' },
  { id: 'rose', label: '레드', bg: 'bg-rose-500' },
  { id: 'purple', label: '퍼플', bg: 'bg-purple-500' },
  { id: 'indigo', label: '인디고', bg: 'bg-indigo-500' },
];

export const AddEditMedModal: React.FC<AddEditMedModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMed,
}) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:30');
  const [dosage, setDosage] = useState('1정');
  const [memo, setMemo] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('prescription');
  const [color, setColor] = useState('blue');
  const [stock, setStock] = useState<number>(30);
  const [refillThreshold, setRefillThreshold] = useState<number>(7);

  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name);
      setTime(editingMed.time);
      setDosage(editingMed.dosage || '1정');
      setMemo(editingMed.memo || '');
      setCategory(editingMed.category || 'prescription');
      setColor(editingMed.color || 'blue');
      setStock(editingMed.stock ?? 30);
      setRefillThreshold(editingMed.refillThreshold ?? 7);
    } else {
      setName('');
      setTime('08:30');
      setDosage('1정');
      setMemo('');
      setCategory('prescription');
      setColor('blue');
      setStock(30);
      setRefillThreshold(7);
    }
  }, [editingMed, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !time.trim()) return;

    onSave({
      id: editingMed ? editingMed.id : undefined,
      name: name.trim(),
      time,
      dosage: dosage.trim() || '1정',
      memo: memo.trim(),
      category,
      color,
      stock: Number(stock) || 0,
      refillThreshold: Number(refillThreshold) || 5,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isActive: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingMed ? '복약 정보 수정' : '새로운 약 등록'}
              </h3>
              <p className="text-xs text-slate-500">
                복용 시간과 용법을 설정하면 정시에 알려드립니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              약 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 비타민 D, 혈압약(암로디핀), 오메가-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Time & Dosage in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                복용 시간 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1회 복용량
              </label>
              <input
                type="text"
                placeholder="예: 1정, 2캡슐, 1포"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Fast Time Presets */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
              자주 쓰는 시간대 빠른 선택
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TIME_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setTime(p.time)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    time === p.time
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label} ({p.time})
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              약 분류
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'prescription', label: '처방약' },
                { id: 'supplement', label: '영양제' },
                { id: 'chronic', label: '만성질환' },
                { id: 'otc', label: '일반약' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as MedicationCategory)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                    category === c.id
                      ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              식별 라벨 색상
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                    color === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Memo & Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              메모 및 복용 안내
            </label>
            <textarea
              rows={2}
              placeholder="예: 식후 30분, 충분한 물과 함께 복용, 자몽과 함께 복용 금지"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {/* Memo Presets */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {MEMO_PRESETS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMemo(m)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  +{m}
                </button>
              ))}
            </div>
          </div>

          {/* Stock & Refill Alert */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                현재 남은 수량 (알/개)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                재처방 알림 기준 (수량 이하 시)
              </label>
              <input
                type="number"
                min="1"
                value={refillThreshold}
                onChange={(e) => setRefillThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-xs transition-all"
            >
              {editingMed ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
