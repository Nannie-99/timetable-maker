import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useTimetableState } from './hooks/useTimetableState';
import PreviewCanvas from './components/PreviewCanvas';
const Controls = lazy(() => import('./components/Controls'));
import { Download, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const { state, updateState, updateGridCell, updateTime, resetState } = useTimetableState();
  const canvasRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
    const container = canvasRef.current;
    
    // Exact dimensions of the preview container at the moment of capture
    const originalWidth = container.offsetWidth;
    const originalHeight = container.offsetHeight;
    
    // 2026 Ultra-High Resolution Strategy: 
    // Increase target width to 2560px (QHD+) to ensure pixel-perfect quality even after JPEG encoding.
    const targetWidth = 2560; 
    const scale = targetWidth / originalWidth;
    
    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        scale: scale, 
        backgroundColor: '#000000',
        logging: false,
        width: originalWidth,
        height: originalHeight,
        windowWidth: originalWidth,
        windowHeight: originalHeight,
        imageTimeout: 0,
        // High-performance rendering hints
        allowTaint: true,
        backgroundColor: null,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.querySelector('[data-canvas-container]');
          if (clonedEl) {
            clonedEl.style.width = `${originalWidth}px`;
            clonedEl.style.height = `${originalHeight}px`;
            clonedEl.style.minWidth = `${originalWidth}px`;
            clonedEl.style.maxWidth = `${originalWidth}px`;
            clonedEl.style.minHeight = `${originalHeight}px`;
            clonedEl.style.maxHeight = `${originalHeight}px`;
            clonedEl.style.borderRadius = '0';
            clonedEl.style.position = 'fixed';
            clonedEl.style.top = '0';
            clonedEl.style.left = '0';
            clonedEl.style.margin = '0';
            clonedEl.style.padding = '0';
            clonedEl.style.transform = 'none';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.overflow = 'hidden';
            clonedEl.style.display = 'block';

            // Boost image quality in the clone
            const imgs = clonedEl.querySelectorAll('img');
            imgs.forEach(img => {
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover'; // Support for 2026 rendering standards
              img.style.display = 'block';
              img.style.imageRendering = 'high-quality';
              img.style.transform = 'none';
            });

            // Ensure all text is sharp
            const allElements = clonedEl.querySelectorAll('*');
            allElements.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.textShadow = 'none';
                el.style.webkitFontSmoothing = 'antialiased';
              }
            });
          }
        }
      });
      
      // Generate ultra-high quality JPEG data URL
      // Priority: Quality 1.0 (Maximum)
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      
      // Open in new window for direct gallery save (Long-press)
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>초고화질 배경화면 저장</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; cursor: pointer; -webkit-touch-callout: default; }
                .hint { position: fixed; bottom: 30px; left: 0; right: 0; text-align: center; color: #fff; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 500; opacity: 0.9; pointer-events: none; text-shadow: 0 2px 8px rgba(0,0,0,0.8); background: rgba(0,0,0,0.3); padding: 10px; backdrop-filter: blur(5px); }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="Timetable Wallpaper" />
              <div class="hint">💡 이미지를 길게 눌러 [사진 앱에 저장] 하세요</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.');
      }
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
    <div className="flex flex-col h-dvh max-w-lg mx-auto bg-black text-white overflow-hidden border-x border-canvas-border relative">
      <header className="py-[0.7rem] px-4 relative flex items-center justify-center border-b border-canvas-border bg-black/80 backdrop-blur-md z-10">
        <h1 className="text-lg font-bold tracking-tight text-white/40">시간표 메이커</h1>
        <button 
          onClick={() => setIsInfoOpen(true)}
          className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
        >
          <Info size={18} />
        </button>
      </header>

      {isInfoOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInfoOpen(false)} />
          <div className="relative w-full max-w-sm h-[540px] bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/5 opacity-40 hover:opacity-100 transition-all z-20"
            >
              <X size={20} />
            </button>
            
            <div className="flex-1 overflow-y-auto p-6 pt-10 content-scrollbar">
              <div className="space-y-4">
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
                      <div className="bg-white/10 border border-accent-neon/20 rounded-xl p-4 mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-accent-neon bg-accent-neon/10 px-2 py-0.5 rounded-lg">v1.0.1</span>
                          <span className="text-[10px] text-white/30 font-medium">2026.03.28</span>
                        </div>
                        <ul className="text-[11px] text-white/70 space-y-2 list-disc pl-4 marker:text-accent-neon/50">
                          <li className="font-bold text-white">성능 및 안정성 최적화</li>
                          <li>화면 비율 로딩 속도 및 렌더링 효율성 개선</li>
                          <li>앱 초기 로딩 시 발생하던 미세한 크래시 현상 해결</li>
                          <li>폰트 로딩 방식 최적화로 텍스트 깜빡임 방지</li>
                        </ul>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 opacity-60">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-lg">v1.0.0</span>
                          <span className="text-[10px] text-white/30 font-medium">2026.03.20</span>
                        </div>
                        <ul className="text-[11px] text-white/50 space-y-2 list-disc pl-4">
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

      {isHelpOpen && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHelpOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col p-6 pointer-events-auto">
            <h3 className="text-sm font-bold text-white/90 mb-4 flex items-center gap-2">
              <span>💡</span> 다운로드가 안 되나요?
            </h3>
            
            <div className="space-y-4 text-[11px] leading-relaxed text-white/70">
              <p>
                카카오톡, 인스타그램 등 <span className="text-accent-neon font-bold">인앱 브라우저</span>에서는 보안 상의 이유로 파일 다운로드 기능이 정상적으로 작동하지 않을 수 있습니다.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                <p className="text-white/40 font-bold text-[9px] uppercase tracking-wider">해결 방법</p>
                <p>
                  화면 오른쪽 상단의 <span className="text-white font-bold">메뉴(⋮ 또는 ...)</span>를 누른 뒤, <span className="text-white font-bold">"다른 브라우저로 열기"</span> 또는 <span className="text-white font-bold">"Chrome으로 열기"</span>를 선택하여 다시 시도해 주세요.
                </p>
              </div>

              <p className="pt-2">
                위 방법을 시도해도 문제가 계속된다면 인스타그램 <span className="text-accent-neon font-bold">@hello.nan_ssaem</span>으로 DM 주시면 도와드리겠습니다!
              </p>
            </div>

            <button 
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all text-white/60"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 p-4 flex items-center justify-center bg-black/50 overflow-hidden">
          <PreviewCanvas state={state} updateState={updateState} canvasRef={canvasRef} isExporting={isExporting} />
        </div>
        
        <div className="h-[55%] border-t border-canvas-border bg-black/90 backdrop-blur-xl">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent-neon border-t-transparent rounded-full" />
            </div>
          }>
            <Controls 
              state={state} 
              updateState={updateState} 
              updateGridCell={updateGridCell}
              updateTime={updateTime}
              resetState={resetState}
            />
          </Suspense>
        </div>
      </main>

      <div className="p-4 bg-black/80 backdrop-blur-md border-t border-canvas-border flex flex-col gap-2">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-accent-neon text-black font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:brightness-105 hover:shadow-[0_0_20px_rgba(0,255,204,0.15)] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <span className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
          ) : (
            <Download size={20} />
          )}
          <span>배경화면 다운로드</span>
        </button>
        <footer className="text-center text-[9px] text-white/30 tracking-tight mt-1 flex items-center justify-center gap-1">
          <span>©2026. 난쌤 All rights reserved.</span>
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="underline underline-offset-2 hover:text-white/60 transition-colors"
          >
            [다운로드가 안될 때]
          </button>
        </footer>
      </div>
      <Analytics />
    </div>
  );
}
