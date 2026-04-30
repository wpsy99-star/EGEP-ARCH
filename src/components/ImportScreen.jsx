import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";

export default function ImportScreen({ onFileSelect, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    setError("");
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("xlsx 또는 xls 파일만 가져올 수 있습니다.");
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => handleFile(e.target.files[0]);

  if (compact) {
    return (
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        파일 가져오기
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onInputChange} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div className="max-w-lg w-full">
        {/* 로고/타이틀 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">건공 EGEP 연구비 집행현황</h1>
          <p className="text-sm text-slate-500 mt-1">EGEP에서 다운로드한 집행현황 엑셀 파일을 가져오세요</p>
        </div>

        {/* 드롭존 */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${dragging
              ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
              : "border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
            }
          `}
        >
          <Upload className={`w-10 h-10 mx-auto mb-4 ${dragging ? "text-indigo-500" : "text-slate-400"}`} />
          <p className="text-base font-medium text-slate-700 mb-1">
            {dragging ? "여기에 놓으세요" : "엑셀 파일을 끌어다 놓거나 클릭하세요"}
          </p>
          <p className="text-xs text-slate-400">.xlsx, .xls 파일 지원</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onInputChange} />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          데이터는 이 기기에만 저장되며 외부로 전송되지 않습니다
        </p>
      </div>
    </div>
  );
}
