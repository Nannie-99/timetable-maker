import React, { useState, useMemo } from 'react';
import { 
  Calendar, Image as ImageIcon, Palette, Settings2, Plus, Minus, Upload, RotateCcw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Accordion = ({ title, children, isOpen, onToggle }) => (
  <div className="border border-white/10 rounded-xl overflow-hidden mb-4 bg-white/5">
    <button 
      onClick={onToggle}
      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
    >
      <span className="text-sm font-bold opacity-80">{title}</span>
      {isOpen ? <ChevronUp size={18} className="opacity-40" /> : <ChevronDown size={18} className="opacity-40" />}
    </button>
    {isOpen && (
      <div className="p-4 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-300">
        <div className="h-px bg-white/10 mb-4" />
        {children}
      </div>
    )}
  </div>
);

export default function Controls({ state, updateState, updateGridCell, updateTime, resetState }) {
  const { activeTab } = state;

  const tabs = [
    { id: 1, label: '시간표', icon: Calendar },
    { id: 2, label: '배경', icon: ImageIcon },
    { id: 3, label: '스타일', icon: Palette },
    { id: 4, label: '디테일', icon: Settings2 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => updateState({ activeTab: tab.id })}
              className={cn(
                "flex-1 py-[0.7rem] flex flex-col items-center gap-1 transition-all relative",
                isActive ? "text-accent-neon" : "text-white/40 hover:text-white/60"
              )}
            >
              <Icon size={18} />
              <span className="text-[10px] font-bold">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-4 h-0.5 bg-accent-neon rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 content-scrollbar">
        {activeTab === 1 && <TimetableTab state={state} updateState={updateState} updateGridCell={updateGridCell} />}
        {activeTab === 2 && <BackgroundTab state={state} updateState={updateState} />}
        {activeTab === 3 && <StyleTab state={state} updateState={updateState} />}
        {activeTab === 4 && <DetailTab state={state} updateState={updateState} updateTime={updateTime} resetState={resetState} />}
      </div>
    </div>
  );
}

function TimetableTab({ state, updateState, updateGridCell }) {
  const { periods, gridData } = state;
  const days = ['월', '화', '수', '목', '금'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold opacity-60">교시 수 (1-8)</label>
        <div className="flex items-center gap-4 bg-white/5 rounded-xl p-1 border border-white/20">
          <button 
            onClick={() => updateState({ periods: Math.max(1, periods - 1) })}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-bold w-4 text-center">{periods}</span>
          <button 
            onClick={() => updateState({ periods: Math.min(8, periods + 1) })}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: periods }).map((_, r) => (
          <div key={r} className="space-y-2">
            <h3 className="text-xs font-bold opacity-30 uppercase tracking-widest">{r + 1}교시</h3>
            <div className="grid grid-cols-5 gap-2">
              {days.map((day, c) => (
                <input
                  key={day}
                  type="text"
                  value={gridData[r][c] || ''}
                  onChange={(e) => updateGridCell(r, c, e.target.value)}
                  placeholder={day}
                  className="bg-white/5 border border-white/20 rounded-lg p-2 text-[10px] text-center focus:border-accent-neon/50 outline-none transition-all placeholder:opacity-20"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackgroundTab({ state, updateState }) {
  const [uploadError, setUploadError] = useState('');
  const presets = [
    { id: '강아지', name: '강아지', thumb: '/backgrounds/강아지.png' },
    { id: '고양이', name: '고양이', thumb: '/backgrounds/고양이.png' },
    { id: '눈사람', name: '눈사람', thumb: '/backgrounds/눈사람.jpg' },
    { id: '도서관', name: '도서관', thumb: '/backgrounds/도서관.jpg' },
    { id: '레몬', name: '레몬', thumb: '/backgrounds/레몬.png' },
    { id: '바다', name: '바다', thumb: '/backgrounds/바다.jpg' },
    { id: '성', name: '성', thumb: '/backgrounds/성.jpg' },
    { id: '케이크', name: '케이크', thumb: '/backgrounds/케이크.jpg' },
    { id: '튤립', name: '튤립', thumb: '/backgrounds/튤립.png' },
    { id: '푸딩', name: '푸딩', thumb: '/backgrounds/푸딩.jpg' },
    { id: '픽셀', name: '픽셀', thumb: '/backgrounds/픽셀.png' },
    { id: '하트', name: '하트', thumb: '/backgrounds/하트.png' },
  ].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setUploadError(''); // Reset error
    
    if (file) {
      // 2026 Best Practice: Check file size before processing to prevent memory crash
      // 10MB limit for stable mobile/web performance
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        setUploadError(`지원 용량(최대 10MB) 초과`);
        e.target.value = ''; // Reset input
        return;
      }

      // Memory-efficient Blob URL
      const imageUrl = URL.createObjectURL(file);
      updateState({ bgType: 'custom', bgValue: imageUrl });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold opacity-60">화면 비율</label>
        <div className="grid grid-cols-3 gap-2">
          {['9:16', '9:19.5', '9:20'].map((ratio) => (
            <button
              key={ratio}
              onClick={() => updateState({ aspectRatio: ratio })}
              className={cn(
                "py-2 rounded-xl text-xs font-bold border transition-all",
                state.aspectRatio === ratio ? "bg-accent-neon text-black border-accent-neon opacity-100" : "bg-white/5 border-white/20 opacity-40 hover:opacity-100"
              )}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold opacity-60">배경 테마</label>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x scroll-smooth no-scrollbar">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => updateState({ bgType: 'preset', bgValue: p.id })}
              className={cn(
                "flex-shrink-0 w-24 flex flex-col items-center gap-1.5 transition-all snap-start",
                state.bgValue === p.id && state.bgType === 'preset' ? "ring-2 ring-accent-neon ring-offset-2 ring-offset-black rounded-lg" : "opacity-40 hover:opacity-100"
              )}
            >
              <div 
                className="w-full aspect-[9/16] rounded-lg border border-white/20 bg-cover bg-center"
                style={{ backgroundImage: `url(${p.thumb})` }}
              />
              <span className="text-[9px] font-bold">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold opacity-60">나의 사진</label>
          {uploadError && <span className="text-[10px] text-red-500 font-bold animate-pulse">{uploadError}</span>}
        </div>
        <div className="flex items-center gap-2">
          <input type="file" onChange={handleFileUpload} accept="image/*" id="bg-upload" className="hidden" />
          <label 
            htmlFor="bg-upload"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all font-bold text-xs"
          >
            <Upload size={14} />
            사진 선택하기
          </label>
        </div>
      </div>

      {/* Background Brightness Control */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex justify-between">
          <label className="text-sm font-bold opacity-60">배경 밝기</label>
          <span className="text-xs opacity-40">{Math.round((1 - state.bgDim) * 100)}%</span>
        </div>
        <div className="flex flex-col gap-1.5 px-0.5">
          <input 
            type="range" min="0" max="0.9" step="0.01" 
            value={state.bgDim} 
            onChange={(e) => updateState({ bgDim: parseFloat(e.target.value) })}
            className="w-full accent-accent-neon"
          />
          <div className="flex justify-between px-0.5">
            <span className="text-[10px] opacity-30 font-bold">밝게</span>
            <span className="text-[10px] opacity-30 font-bold">어둡게</span>
          </div>
        </div>
      </div>

      {/* Background Zoom Control */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex justify-between">
          <label className="text-sm font-bold opacity-60">배경 확대</label>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-40">{Math.round((state.bgTransform?.scale || 1) * 100)}%</span>
            <button 
              onClick={() => updateState({ bgTransform: { scale: 1, x: 0, y: 0 }})}
              className="px-2 py-1 bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/20 transition-all"
            >
              초기화
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 px-0.5">
          <input 
            type="range" min="1" max="2.5" step="0.01" 
            value={state.bgTransform?.scale || 1} 
            onChange={(e) => updateState({ bgTransform: { ...state.bgTransform, scale: parseFloat(e.target.value) }})}
            className="w-full accent-accent-neon"
          />
          <div className="flex justify-between px-0.5">
            <span className="text-[10px] opacity-30 font-bold">축소</span>
            <span className="text-[10px] opacity-30 font-bold">확대</span>
          </div>
        </div>
        <p className="text-[10px] opacity-40 text-center mt-2">미리보기의 배경을 드래그하여 위치를 옮길 수 있습니다.</p>
      </div>

    </div>
  );
}

function StyleTab({ state, updateState }) {
  const { gridStyle } = state;
  const [openAccordions, setOpenAccordions] = useState({
    cell: false,
    border: false,
    text: false,
    position: true
  });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateGridStyle = (updates) => {
    updateState({ gridStyle: { ...gridStyle, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* 1. Scale & Position Accordion (Moved to top) */}
      <Accordion 
        title="크기 및 위치" 
        isOpen={openAccordions.position} 
        onToggle={() => toggleAccordion('position')}
      >
        <div className="space-y-6 pt-2">
          {/* Scale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold opacity-60">크기 조절</label>
              <button 
                onClick={() => updateGridStyle({ scale: 170 })}
                className="px-2 py-1 bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                초기화
              </button>
            </div>
            <div className="flex flex-col gap-1.5 px-0.5">
              <input 
                type="range" min="130" max="210" 
                value={gridStyle.scale} 
                onChange={(e) => updateGridStyle({ scale: parseInt(e.target.value) })}
                className="w-full accent-accent-neon"
              />
              <div className="flex justify-between px-0.5">
                <span className="text-[10px] opacity-30 font-bold">작게</span>
                <span className="text-[10px] opacity-30 font-bold">크게</span>
              </div>
            </div>
          </div>

          {/* X Position */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold opacity-60">위치 조절 (X축)</label>
              <button 
                onClick={() => updateGridStyle({ xPosition: 49 })}
                className="px-2 py-1 bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                초기화
              </button>
            </div>
            <div className="flex flex-col gap-1.5 px-0.5">
              <input 
                type="range" min="30" max="70" 
                value={gridStyle.xPosition || 49} 
                onChange={(e) => updateGridStyle({ xPosition: parseFloat(e.target.value) })}
                className="w-full accent-accent-neon"
                step="0.5"
              />
              <div className="flex justify-between px-0.5">
                <span className="text-[10px] opacity-30 font-bold">좌측</span>
                <span className="text-[10px] opacity-30 font-bold">우측</span>
              </div>
            </div>
          </div>

          {/* Y Position */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold opacity-60">위치 조절 (Y축)</label>
              <button 
                onClick={() => updateGridStyle({ yPosition: 65 })}
                className="px-2 py-1 bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                초기화
              </button>
            </div>
            <div className="flex flex-col gap-1.5 px-0.5">
              <input 
                type="range" min="0" max="100" 
                value={gridStyle.yPosition || 65} 
                onChange={(e) => updateGridStyle({ yPosition: parseFloat(e.target.value) })}
                className="w-full accent-accent-neon"
                step="0.5"
              />
              <div className="flex justify-between px-0.5">
                <span className="text-[10px] opacity-30 font-bold">위로</span>
                <span className="text-[10px] opacity-30 font-bold">아래로</span>
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      {/* 2. Cell Style Accordion */}
      <Accordion 
        title="셀 스타일" 
        isOpen={openAccordions.cell} 
        onToggle={() => toggleAccordion('cell')}
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold opacity-60">셀 색상</label>
          <div className="flex gap-2">
            <button 
              onClick={() => updateGridStyle({ showCellBg: !gridStyle.showCellBg })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                !gridStyle.showCellBg ? "bg-accent-neon text-black" : "bg-white/10 text-white"
              )}
            >
              색상 없음
            </button>
            <input 
              type="color" 
              value={gridStyle.cellColor} 
              onChange={(e) => updateGridStyle({ cellColor: e.target.value })}
              className="w-10 h-8 rounded-lg bg-transparent cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <label className="text-sm font-bold opacity-60">투명도</label>
            <span className="text-xs opacity-40">{Math.round(gridStyle.opacity * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={gridStyle.opacity} 
            onChange={(e) => updateGridStyle({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-accent-neon"
          />
        </div>
      </Accordion>

      {/* 3. Border Style Accordion */}
      <Accordion 
        title="테두리 스타일" 
        isOpen={openAccordions.border} 
        onToggle={() => toggleAccordion('border')}
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold opacity-60">테두리 색상</label>
          <div className="flex gap-2">
            <button 
              onClick={() => updateGridStyle({ showBorder: !gridStyle.showBorder })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                !gridStyle.showBorder ? "bg-accent-neon text-black" : "bg-white/10 text-white"
              )}
            >
              테두리 없음
            </button>
            <input 
              type="color" 
              value={gridStyle.borderColor || '#ffffff'} 
              onChange={(e) => updateGridStyle({ borderColor: e.target.value })}
              className="w-10 h-8 rounded-lg bg-transparent cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold opacity-60 block">둥글기</label>
          <div className="flex gap-2">
            {[
              { id: 'none', label: '없음' },
              { id: 'some', label: '조금' },
              { id: 'lot', label: '많이' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => updateGridStyle({ roundness: r.id })}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  gridStyle.roundness === r.id ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </Accordion>

      {/* 4. Text Style Accordion */}
      <Accordion 
        title="글자 스타일" 
        isOpen={openAccordions.text} 
        onToggle={() => toggleAccordion('text')}
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold opacity-60">글자 색상</label>
          <input 
            type="color" 
            value={gridStyle.fontColor || gridStyle.textColor} 
            onChange={(e) => updateGridStyle({ fontColor: e.target.value })}
            className="w-10 h-8 rounded-lg bg-transparent cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold opacity-60 block">글꼴</label>
          <div className="flex gap-2">
            {[
              { id: 'default', label: '기본' },
              { id: 'rounded', label: '둥근' },
              { id: 'thick', label: '두꺼운' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => updateGridStyle({ fontFamily: f.id })}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  gridStyle.fontFamily === f.id ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Accordion>
    </div>
);
}

function DetailTab({ state, updateState, updateTime, resetState }) {
  const { periods, showTimes, times, customText } = state;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold opacity-60">수업 시간 표시</label>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {[true, false].map((v) => (
            <button
              key={v.toString()}
              onClick={() => updateState({ showTimes: v })}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                showTimes === v ? "bg-white/10 text-white" : "text-white/20"
              )}
            >
              {v ? 'On' : 'Off'}
            </button>
          ))}
        </div>
      </div>

      {showTimes && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {Array.from({ length: periods }).map((_, r) => (
            <div key={r} className="flex items-center gap-3">
              <span className="text-[10px] font-bold opacity-30 w-10">{r + 1}교시</span>
              <div className="flex-1 flex items-center gap-2">
                <input 
                  type="time" value={times[r].start} 
                  onChange={(e) => updateTime(r, 'start', e.target.value)}
                  className="bg-white/5 border border-white/20 rounded-lg p-1.5 text-xs text-center flex-1 outline-none text-white/60 focus:text-accent-neon"
                />
                <span className="opacity-20">-</span>
                <input 
                  type="time" value={times[r].end} 
                  onChange={(e) => updateTime(r, 'end', e.target.value)}
                  className="bg-white/5 border border-white/20 rounded-lg p-1.5 text-xs text-center flex-1 outline-none text-white/60 focus:text-accent-neon"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-white/5">
        <label className="text-sm font-bold opacity-60">추가 텍스트</label>
        <div className="space-y-2">
          <input 
            type="text" placeholder="학교 이름 (예: 한국고등학교)" 
            value={customText.school}
            onChange={(e) => updateState({ customText: { ...customText, school: e.target.value } })}
            className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-xs outline-none focus:border-white/20 transition-all"
          />
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text" placeholder="학년/반" 
              value={customText.gradeClass}
              onChange={(e) => updateState({ customText: { ...customText, gradeClass: e.target.value } })}
              className="bg-white/5 border border-white/20 rounded-xl p-3 text-xs outline-none focus:border-white/20"
            />
            <input 
              type="text" placeholder="기타 (예: 이름)" 
              value={customText.subject}
              onChange={(e) => updateState({ customText: { ...customText, subject: e.target.value } })}
              className="bg-white/5 border border-white/20 rounded-xl p-3 text-xs outline-none focus:border-white/20"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 pb-4">
        <button
          onClick={() => {
            if (window.confirm('모든 설정값(시간표, 배경, 스타일 등)을 초기화하시겠습니까?')) {
              resetState();
            }
          }}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[13px] font-bold text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          일괄 초기화
        </button>
      </div>
    </div>
  );
}
