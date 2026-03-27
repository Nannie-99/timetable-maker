import React, { useState, useRef, useEffect } from 'react';
import { useTimetableState } from './hooks/useTimetableState';
import PreviewCanvas from './components/PreviewCanvas';
import Controls from './components/Controls';
import { Download, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function App() {
  const { state, updateState, updateGridCell, updateTime, resetState } = useTimetableState();
  const canvasRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoAccordions, setInfoAccordions] = useState({
    profile: true,
    intro: false,
    updates: false
  });

  // Reset accordions when modal opens
  useEffect(() => {
    if (isInfoOpen) {
      setInfoAccordions({
        profile: true,
        intro: false,
        updates: false
      });
    }
  }, [isInfoOpen]);

  const handleDownload = async () => {
    if (!canvasRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        scale: 3, 
        backgroundColor: '#000000',
      });
      
      const link = document.createElement('a');
      link.download = `timetable_wallpaper_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed', err);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleInfoAccordion = (key) => {
    setInfoAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-black text-white overflow-hidden border-x border-canvas-border relative">
      {/* Top Header */}
      <header className="p-4 relative flex items-center justify-center border-b border-canvas-border bg-black/80 backdrop-blur-md z-10">
        <h1 className="text-lg font-bold tracking-tight text-white/90">✨ 시간표 메이커 ✨</h1>
        <button 
          onClick={() => setIsInfoOpen(true)}
          className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
        >
          <Info size={18} />
        </button>
      </header>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInfoOpen(false)} />
          <div className="relative w-full max-w-sm h-[540px] bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            {/* Header / Close (Top Right) */}
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/5 opacity-40 hover:opacity-100 transition-all z-20"
            >
              <X size={20} />
            </button>
            
            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto p-6 pt-10 content-scrollbar">
              <div className="space-y-4">
                {/* 1. Developer Profile Accordion */}
                <section className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleInfoAccordion('profile')}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-lg">🧑‍💻</span>
                      <div>
                        <h3 className="text-sm font-bold text-white/90">개발자 프로필</h3>
                        <p className="text-[10px] text-accent-neon font-bold">난쌤 (@hello.nan_ssaem)</p>
                      </div>
                    </div>
                    {infoAccordions.profile ? <ChevronUp size={16} className="opacity-40" /> : <ChevronDown size={16} className="opacity-40" />}
                  </button>
                  
                  {infoAccordions.profile && (
                    <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <p className="text-xs text-white/80 flex items-start gap-2">
                          <span>☕</span> 
                          <span>낮에는 초등교사, 밤에는 개발자</span>
                        </p>
                        <p className="text-xs text-white/80 flex items-start gap-2">
                          <span>💡</span> 
                          <span>구글 전국 강사단 | GCT 보유 | AIEDAP 마스터교원</span>
                        </p>
                        <p className="text-xs text-white/80 flex items-start gap-2">
                          <span>💻</span> 
                          <span>교육용 웹앱 1인 개발 중</span>
                        </p>
                      </div>
                      
                      <div className="pt-3 border-t border-white/5">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">소통 및 문의 안내</h4>
                        <div className="space-y-2">
                          <p className="text-[11px] text-white/60 leading-relaxed">
                            - 인스타그램 개설 한 달 만에 1,000분이 넘는 선생님, 학생들과 소통하며 교육 기술 정보를 나누고 있습니다.
                          </p>
                          <p className="text-[11px] text-white/60 leading-relaxed">
                            - 앱 사용 중 오류가 발생하거나 추가되었으면 하는 기능이 있다면 언제든 인스타그램 DM으로 연락해 주세요!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. App Introduction Accordion */}
                <section className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleInfoAccordion('intro')}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📱</span>
                      <h3 className="text-sm font-bold text-white/90">시간표 메이커 소개</h3>
                    </div>
                    {infoAccordions.intro ? <ChevronUp size={16} className="opacity-40" /> : <ChevronDown size={16} className="opacity-40" />}
                  </button>
                  
                  {infoAccordions.intro && (
                    <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-accent-neon/5 border border-accent-neon/10 rounded-xl p-4 mt-2">
                        <p className="text-xs text-accent-neon font-bold leading-relaxed italic mb-2">
                          "더 이상 딱딱한 한글, 엑셀 표 스크린샷을 배경화면으로 쓰지 마세요!"
                        </p>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          '시간표 메이커'는 매일 시간표를 확인해야 하는 전국의 중·고·대학생과 선생님들을 위해 제작되었습니다. 업무와 학업 때문에 억지로 설정해 두었던 투박한 시간표 대신, 내가 좋아하는 사진이나 감성적인 테마를 배경으로 삼아 나만의 예쁜 시간표 배경화면을 쉽고 빠르게 만들어 보세요.
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Update Log Accordion */}
                <section className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleInfoAccordion('updates')}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📦</span>
                      <h3 className="text-sm font-bold text-white/90">업데이트 내역</h3>
                    </div>
                    {infoAccordions.updates ? <ChevronUp size={16} className="opacity-40" /> : <ChevronDown size={16} className="opacity-40" />}
                  </button>
                  
                  {infoAccordions.updates && (
                    <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-accent-neon bg-accent-neon/10 px-2 py-0.5 rounded-lg">v1.0.0</span>
                          <span className="text-[10px] text-white/30 font-medium">2026.03.20</span>
                        </div>
                        <ul className="text-[11px] text-white/50 space-y-2 list-disc pl-4 marker:text-accent-neon/50">
                          <li>프리미엄 시간표 테마 14종 출시</li>
                          <li>사용자 맞춤형 위치/크기 정밀 조절 시스템</li>
                          <li>내 갤러리 속 커스텀 배경 이미지 업로드</li>
                          <li>다양한 기기 대응 (Standard/Max/Ultra 3개 비율)</li>
                          <li>원터치 고해상도 PNG 배경화면 저장</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
            
            {/* Sticky Footer Section */}
            <div className="p-4 bg-black/40 border-t border-white/5">
              <button 
                onClick={() => setIsInfoOpen(false)}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 p-4 flex items-center justify-center bg-black/50 overflow-hidden">
          <PreviewCanvas state={state} updateState={updateState} canvasRef={canvasRef} />
        </div>
        
        <div className="h-[45%] border-t border-canvas-border bg-black/90 backdrop-blur-xl">
          <Controls 
            state={state} 
            updateState={updateState} 
            updateGridCell={updateGridCell}
            updateTime={updateTime}
            resetState={resetState}
          />
        </div>
      </main>

      {/* Fixed Bottom Action */}
      <div className="p-4 bg-black/80 backdrop-blur-md border-t border-canvas-border flex flex-col gap-2">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-gradient-to-r from-accent-neon to-indigo-500 text-black font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <span className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
          ) : (
            <Download size={20} />
          )}
          <span>배경화면 다운로드</span>
        </button>
        <footer className="text-center text-[9px] text-white/30 tracking-tight mt-1">
          ©2026. 난쌤 All rights reserved. @hello.nan_ssaem
        </footer>
      </div>
    </div>
  );
}
