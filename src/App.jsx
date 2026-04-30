import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { DataProvider, useData } from "./context/DataContext.jsx";
import ResearchFundDashboard, {
  DEFAULT_RAW_DATA,
  DEFAULT_BUDGET_MAP,
  DEFAULT_BIMOK_TO_BUDGET,
  DEFAULT_BIMOK_SHORT,
} from "./pages/ResearchFundDashboard.jsx";
import ImportScreen from "./components/ImportScreen.jsx";

function normalizeDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === 'string') {
    const m = val.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return null;
}

function normalizeRow(row) {
  const get = (key) => {
    const normalized = String(key).trim().normalize('NFC');
    for (const [k, v] of Object.entries(row)) {
      if (String(k).trim().normalize('NFC') === normalized) return v ?? null;
    }
    return null;
  };
  const 신청일 = normalizeDate(get('신청일'));
  return {
    신청번호: String(get('신청번호') ?? '').trim(),
    순번: Number(get('순번')) || 0,
    비목: String(get('비목') ?? '').trim(),
    지급구분: String(get('지급구분') ?? '').trim(),
    증빙유형: String(get('증빙유형') ?? '').trim(),
    출장_학회보고: String(get('출장/학회보고') ?? get('출장_학회보고') ?? '').trim(),
    내역: String(get('내역') ?? '').trim(),
    신청금액: Number(get('신청금액')) || 0,
    공급가액: Number(get('공급가액')) || 0,
    세액: Number(get('세액')) || 0,
    신청일,
    month_key: 신청일 ? 신청일.slice(0, 7) : null,
    산학승인일: normalizeDate(get('산학승인일')),
    지급예정일: normalizeDate(get('지급(예정)일') ?? get('지급예정일')),
    상태: String(get('상태') ?? '').trim(),
    추출인명: String(get('추출인명') ?? '').trim(),
  };
}

function AppInner() {
  const { months, selectedMonthKey, currentData, addMonth, removeMonth, selectMonth } = useData();
  const [showImportOverlay, setShowImportOverlay] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAllMonths = useCallback(async () => {
    try {
      const monthsRes = await fetch('/api/months');
      const monthsData = await monthsRes.json();
      if (!monthsData.ok) return;
      for (const monthKey of monthsData.months) {
        const recRes = await fetch(`/api/records?month=${monthKey}`);
        const recData = await recRes.json();
        if (recData.ok) {
          addMonth(monthKey, recData.records, DEFAULT_BUDGET_MAP, DEFAULT_BIMOK_TO_BUDGET, DEFAULT_BIMOK_SHORT);
        }
      }
    } catch {}
  }, [addMonth]);

  useEffect(() => {
    loadAllMonths().finally(() => setLoading(false));
  }, []);

  const handleFileSelect = async (file) => {
    setShowImportOverlay(false);
    try {
      // 브라우저에서 엑셀 파싱
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });

      // 컬럼 정규화
      const records = rows.map(normalizeRow).filter(r => r['신청번호']);

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      await loadAllMonths();
      alert(`가져오기 완료: ${data.inserted}건 추가, ${data.skipped}건 중복 건너뜀`);
    } catch (err) {
      alert(`오류: ${err.message}`);
    }
  };

  const handleLoadDemo = () => {
    // 기존 하드코딩 데이터로 데모 월 로드
    const monthKeys = [...new Set(DEFAULT_RAW_DATA.map(r => r["신청일"]?.slice(0, 7)).filter(Boolean))].sort();
    const latestMonth = monthKeys[monthKeys.length - 1] || "2026-04";
    addMonth(latestMonth, DEFAULT_RAW_DATA, DEFAULT_BUDGET_MAP, DEFAULT_BIMOK_TO_BUDGET, DEFAULT_BIMOK_SHORT);
  };

  // 서버에서 데이터 불러오는 중
  if (loading) return null;

  // 데이터가 없으면 ImportScreen + 데모 버튼 표시
  if (Object.keys(months).length === 0) {
    return (
      <div className="relative">
        <ImportScreen onFileSelect={handleFileSelect} />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={handleLoadDemo}
            className="px-4 py-2 bg-slate-700 text-white text-xs font-medium rounded-full shadow-lg hover:bg-slate-800 transition-colors opacity-70 hover:opacity-100"
          >
            데모 데이터로 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showImportOverlay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
            <button
              onClick={() => setShowImportOverlay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>
            <div className="p-2">
              <ImportScreen onFileSelect={handleFileSelect} />
            </div>
          </div>
        </div>
      )}
      <ResearchFundDashboard
        records={currentData?.records}
        budgetMap={currentData?.budgetMap}
        bimokToBudget={currentData?.bimokToBudget}
        bimokShort={currentData?.bimokShort}
        onImport={() => setShowImportOverlay(true)}
        months={months}
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={selectMonth}
        onRemoveMonth={removeMonth}
      />
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  );
}
