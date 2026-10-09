import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Medication, MedicationCategory } from '../types';

interface MedicationListProps {
  medications: Medication[];
  onOpenAddModal: () => void;
  onEditMed: (med: Medication) => void;
  onDeleteMed: (medId: string) => void;
  onUpdateStock: (medId: string, newStock: number) => void;
  onToggleActive: (medId: string) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  onOpenAddModal,
  onEditMed,
  onDeleteMed,
  onUpdateStock,
  onToggleActive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredMeds = medications.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.memo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (c: MedicationCategory) => {
    switch (c) {
      case 'prescription':
        return '처방약';
      case 'supplement':
        return '영양제';
      case 'chronic':
        return '만성질환약';
      case 'otc':
        return '일반의약품';
      default:
        return '기타';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              등록된 약 및 영양제 관리
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              총 {medications.length}개의 약품이 등록되어 있습니다. 복용 시간, 용법, 잔여 재고를 관리하세요.
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>새 약 등록</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="약 이름 또는 메모 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {['all', 'prescription', 'supplement', 'chronic', 'otc'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
                }`}
              >
                {cat === 'all' ? '전체 보기' : getCategoryName(cat as MedicationCategory)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Medication Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeds.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">
              조건에 맞는 약이 없습니다.
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              검색어를 변경하거나 새로운 약을 등록해보세요.
            </p>
          </div>
        ) : (
          filteredMeds.map((med) => {
            const isLowStock = med.stock <= med.refillThreshold;

            return (
              <div
                key={med.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor:
                    med.color === 'emerald'
                      ? '#10b981'
                      : med.color === 'rose'
                      ? '#f43f5e'
                      : med.color === 'amber'
                      ? '#f59e0b'
                      : med.color === 'purple'
                      ? '#a855f7'
                      : med.color === 'indigo'
                      ? '#6366f1'
                      : '#2563eb',
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {med.time}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {getCategoryName(med.category)}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {med.dosage}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">
                        {med.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditMed(med)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`'${med.name}' 약을 정말 삭제하시겠습니까?`)) {
                            onDeleteMed(med.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {med.memo && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">
                      {med.memo}
                    </p>
                  )}
                </div>

                {/* Stock Tracker & Refill Alert */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">잔여 수량:</span>
                    <span
                      className={`font-bold ${
                        isLowStock ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {med.stock}개
                    </span>
                    {isLowStock && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        재처방 권장
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateStock(med.id, Math.max(0, med.stock - 1))}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      title="1개 차감"
                    >
                      -
                    </button>
                    <button
                      onClick={() => onUpdateStock(med.id, med.stock + 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      title="1개 추가"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onUpdateStock(med.id, med.stock + 30)}
                      className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors"
                      title="한 달 치(30개) 보충"
                    >
                      +30
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
