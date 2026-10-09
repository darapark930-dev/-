import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  TrendingUp,
  Award,
  Filter,
  FileSpreadsheet,
  Clock,
  Check,
} from 'lucide-react';
import { IntakeLog, Medication } from '../types';
import { getPastDateString, getTodayDateString } from '../utils/storage';

interface HistoryAndAnalyticsProps {
  logs: IntakeLog[];
  medications: Medication[];
}

export const HistoryAndAnalytics: React.FC<HistoryAndAnalyticsProps> = ({
  logs,
  medications,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'taken' | 'skipped'>('all');

  // Compute 7-day adherence data
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const daysAgo = 6 - idx;
    const dateStr = getPastDateString(daysAgo);
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = daysOfWeek[d.getDay()];

    const dayLogs = logs.filter((l) => l.date === dateStr);
    const takenCount = dayLogs.filter((l) => l.status === 'taken').length;
    const totalExpected = dayLogs.length > 0 ? dayLogs.length : medications.length || 1;
    const rate = Math.min(100, Math.round((takenCount / totalExpected) * 100));

    return {
      dateStr,
      dayName,
      shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
      takenCount,
      totalExpected,
      rate,
    };
  });

  const averageRate = Math.round(
    last7Days.reduce((acc, curr) => acc + curr.rate, 0) / last7Days.length
  );

  const totalTaken = logs.filter((l) => l.status === 'taken').length;
  const totalSkipped = logs.filter((l) => l.status === 'skipped').length;

  // Filter logs
  const filteredLogs = [...logs]
    .filter((l) => {
      const matchSearch = l.medicationName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      // Sort desc by date, then by time
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.scheduledTime.localeCompare(a.scheduledTime);
    });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['날짜', '약 이름', '1회 복용량', '복용 예정시간', '실제 복용시간', '상태', '메모'];
    const rows = filteredLogs.map((l) => [
      l.date,
      `"${l.medicationName.replace(/"/g, '""')}"`,
      `"${(l.dosage || '').replace(/"/g, '""')}"`,
      l.scheduledTime,
      l.takenTime || '-',
      l.status === 'taken' ? '복용완료' : '건너뜀',
      `"${(l.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `복약기록부_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 7-Day Adherence Stats Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                주간 복약 순응도 리포트
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                최근 7일간 추이
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              꾸준한 정시 복용은 질환 치료와 건강 유지의 핵심입니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-[11px] text-slate-500">7일 평균 순응도</div>
                <div className="text-lg font-extrabold text-blue-600">{averageRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Bar Chart */}
        <div className="grid grid-cols-7 gap-2 pt-2 pb-1">
          {last7Days.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-slate-600">{day.rate}%</div>
              <div className="w-full bg-slate-100 rounded-lg h-28 flex items-end p-1">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    day.rate >= 90
                      ? 'bg-emerald-500'
                      : day.rate >= 70
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ height: `${Math.max(10, day.rate)}%` }}
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-800">{day.dayName}</div>
                <div className="text-[10px] text-slate-400">{day.shortDate}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 text-xs">누적 복용 완료</span>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{totalTaken}회</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 text-xs">누적 건너뜀/미복용</span>
            <div className="text-lg font-bold text-slate-600 mt-0.5">{totalSkipped}회</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-slate-500 text-xs">기록된 전체 로그</span>
            <div className="text-lg font-bold text-blue-600 mt-0.5">{logs.length}건</div>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              복약 상세 일지
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              정확한 복용 시간과 과거 복용 내역을 검토하거나 의사 상담 자료로 출력하세요.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV 다운로드</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>일지 인쇄</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pt-3 border-t border-slate-100">
          <input
            type="text"
            placeholder="약 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('taken')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                statusFilter === 'taken'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              복용 완료만
            </button>
            <button
              onClick={() => setStatusFilter('skipped')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                statusFilter === 'skipped'
                  ? 'bg-slate-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              건너뜀만
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
              <tr>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">약 이름</th>
                <th className="px-4 py-3">용량</th>
                <th className="px-4 py-3">예정 시간</th>
                <th className="px-4 py-3">실제 복용</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    기록된 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{log.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{log.medicationName}</td>
                    <td className="px-4 py-3 text-slate-600">{log.dosage || '1회'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{log.scheduledTime}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {log.takenTime || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'taken' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" /> 복용 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          건너뜀
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.note || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
