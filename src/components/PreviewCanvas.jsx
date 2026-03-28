import React, { useMemo, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PRESET_FILES = {
  '강아지': '/backgrounds/강아지.png',
  '고양이': '/backgrounds/고양이.png',
  '눈사람': '/backgrounds/눈사람.jpg',
  '도서관': '/backgrounds/도서관.jpg',
  '레몬': '/backgrounds/레몬.png',
  '바다': '/backgrounds/바다.jpg',
  '성': '/backgrounds/성.jpg',
  '케이크': '/backgrounds/케이크.jpg',
  '튤립': '/backgrounds/튤립.png',
  '푸딩': '/backgrounds/푸딩.jpg',
  '픽셀': '/backgrounds/픽셀.png',
  '하트': '/backgrounds/하트.png',
};

export default function PreviewCanvas({ state, updateState, canvasRef, isExporting = false }) {
  const {
    aspectRatio,
    bgType,
    bgValue,
    bgDim,
    bgTransform = { scale: 1, x: 0, y: 0 },
    gridStyle,
    gridData,
    periods,
    days,
    showTimes,
    times,
    customText,
    activeTab,
  } = state;

  const [isDragging, setIsDragging] = React.useState(false);
  const [autoScale, setAutoScale] = React.useState(1);
  const dragStart = React.useRef({ x: 0, y: 0 });

  const isEditMode = activeTab === 1;
  const BASE_WIDTH = 500;

  // Calculate autoScale based on the rendered width of the canvas container
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateScale = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setAutoScale(rect.width / BASE_WIDTH);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(canvasRef.current);
    updateScale();
    
    return () => observer.disconnect();
  }, [canvasRef]);

  const currentRatioString = useMemo(() => {
    if (aspectRatio === '9:19.5') return '9/19.5';
    if (aspectRatio === '9:20') return '9/20';
    return '9/16';
  }, [aspectRatio]);

  // Combine user transform
  const finalScale = bgTransform.scale;
  
  const handleDragStart = (e) => {
    if (isEditMode) return;
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - bgTransform.x, y: clientY - bgTransform.y };
  };

  const handleDragMove = (e) => {
    if (!isDragging || isEditMode) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    if (e.type === 'touchmove') e.preventDefault();

    updateState({
      bgTransform: {
        ...bgTransform,
        x: clientX - dragStart.current.x,
        y: clientY - dragStart.current.y
      }
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Constraint logic for background dragging
  useEffect(() => {
    if (isEditMode || !canvasRef.current || (bgType !== 'preset' && bgType !== 'custom')) return;

    const container = canvasRef.current;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const currentScale = finalScale;
    const imageWidth = containerWidth * currentScale;
    const imageHeight = containerHeight * currentScale;

    const maxX = (imageWidth - containerWidth) / 2;
    const maxY = (imageHeight - containerHeight) / 2;

    let newX = bgTransform.x;
    let newY = bgTransform.y;

    if (Math.abs(newX) > maxX) newX = Math.sign(newX) * maxX;
    if (Math.abs(newY) > maxY) newY = Math.sign(newY) * maxY;

    if (newX !== bgTransform.x || newY !== bgTransform.y) {
      updateState({
        bgTransform: { ...bgTransform, x: newX, y: newY }
      });
    }
  }, [bgTransform, finalScale, isEditMode, bgType, canvasRef]);


  const editScale = useMemo(() => {
    if (!canvasRef.current || !isEditMode) return autoScale * 0.9;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 40;
    const containerWidth = rect.width - padding;
    const containerHeight = rect.height - padding;
    
    const gridWidth = BASE_WIDTH;
    const cellWidth = (BASE_WIDTH - 40) / 6;
    const cellHeight = cellWidth / 1.7;
    const gridHeight = (periods + 1) * cellHeight + (periods * 8);
    
    const sX = containerWidth / gridWidth;
    const sY = containerHeight / gridHeight;
    
    return Math.min(sX, sY);
  }, [autoScale, periods, isEditMode, canvasRef]);

  // 2026 Strategy: Use background-image for maximum robustness in html2canvas.
  // html2canvas supports background-size: cover perfectly, but fails on object-fit: cover.
  const bgImageSource = bgType === 'preset' ? PRESET_FILES[bgValue] || PRESET_FILES['강아지'] : bgValue;

  return (
    <div 
      ref={canvasRef}
      className={cn(
        "relative rounded-3xl transition-all duration-500 bg-[#1a1a1a]",
        isEditMode 
          ? "h-full w-full flex flex-col items-center justify-center p-4 bg-[#111] overflow-auto" 
          : "h-full w-auto max-w-full overflow-hidden"
      )}
      data-canvas-container
      style={!isEditMode ? { 
        aspectRatio: currentRatioString,
        boxSizing: 'border-box'
      } : {}}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Background Layer (DIV with background-image for distortion-free capture) */}
      {!isEditMode && (
        <div 
          className={cn(
            "absolute inset-0 transition-transform duration-150 ease-out flex items-center justify-center",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            transform: `translate(${bgTransform.x}px, ${bgTransform.y}px) scale(${finalScale})`,
            backgroundColor: (bgType !== 'preset' && bgType !== 'custom') ? '#111' : 'transparent',
            // CRITICAL: Using backgroundImage is the most reliable way to prevent stretching in html2canvas
            backgroundImage: (bgType === 'preset' || bgType === 'custom') ? `url("${bgImageSource}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%'
          }}
        />
      )}

      {/* Background Dim Layer */}
      {!isEditMode && (
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none" 
          style={{ opacity: bgDim }}
        />
      )}

      {/* Grid Content */}
      <div 
        className={cn(
          "flex flex-col pointer-events-none transition-all duration-500 items-center justify-center",
          isEditMode ? "w-full h-full p-2" : "absolute inset-0 p-4"
        )}
      >
        <div 
          className="flex flex-col justify-center transition-all duration-500 origin-center"
          style={{ 
            transform: `translate(${!isEditMode ? (gridStyle.xPosition || 50) - 50 : 0}%, ${!isEditMode ? gridStyle.yPosition - 50 : 0}%) scale(${isEditMode ? editScale : (autoScale * 0.8775 * (gridStyle.scale / 170))})`,
            width: `${BASE_WIDTH}px`,
            maxWidth: 'none',
            maxHeight: 'none'
          }}
        >
          <div 
            className="grid grid-cols-6 gap-2 w-full transition-all duration-300"
          >
            {/* Header */}
            <div 
              className={cn(
                "flex items-center justify-center transition-all duration-300",
                gridStyle.roundness === 'some' && "rounded-lg",
                gridStyle.roundness === 'lot' && "rounded-[22px]"
              )}
              style={{ 
                aspectRatio: '1.7 / 1',
                backgroundColor: 'transparent',
                border: 'none'
              }}
            ></div>
            {['월', '화', '수', '목', '금'].map(day => (
              <div 
                key={day} 
                className={cn(
                  "flex items-center justify-center text-[16px] font-bold opacity-85 transition-all duration-300",
                  gridStyle.roundness === 'some' && "rounded-lg",
                  gridStyle.roundness === 'lot' && "rounded-[22px]"
                )}
                style={{ 
                  color: gridStyle.fontColor,
                  fontFamily: gridStyle.fontFamily === 'rounded' 
                    ? "'Jua', sans-serif" 
                    : gridStyle.fontFamily === 'thick' 
                      ? "'Black Han Sans', sans-serif" 
                      : "'Inter', sans-serif",
                  aspectRatio: '1.7 / 1',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
              >
                {day}
              </div>
            ))}

            {/* Rows */}
            {Array.from({ length: periods }).map((_, r) => (
              <React.Fragment key={r}>
                <div 
                  className={cn(
                    "flex flex-col items-center justify-center font-bold opacity-85 transition-all duration-300 overflow-hidden",
                    gridStyle.roundness === 'some' && "rounded-lg",
                    gridStyle.roundness === 'lot' && "rounded-[22px]"
                  )} 
                  style={{ 
                    color: gridStyle.fontColor,
                    fontFamily: gridStyle.fontFamily === 'rounded' 
                      ? "'Jua', sans-serif" 
                      : gridStyle.fontFamily === 'thick' 
                        ? "'Black Han Sans', sans-serif" 
                        : "'Inter', sans-serif",
                    aspectRatio: '1.7 / 1',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ display: 'block', transform: 'translateY(1px)' }}>{r + 1}</span>
                    {showTimes && (
                      <span className="text-[10px] leading-none text-center mt-0.5" style={{ display: 'block' }}>
                        {times[r]?.start}<br/>{times[r]?.end}
                      </span>
                    )}
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, c) => (
                  <div 
                    key={c}
                    className={cn(
                      "flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border border-white/5",
                    gridStyle.roundness === 'some' && "rounded-lg",
                    gridStyle.roundness === 'lot' && "rounded-[22px]"
                  )}
                  style={{ 
                    aspectRatio: '1.7 / 1',
                    padding: '2px',
                    backgroundColor: gridStyle.showCellBg 
                      ? (gridStyle.cellColor + Math.round(gridStyle.opacity * 255).toString(16).padStart(2, '0'))
                      : 'transparent',
                    color: gridStyle.fontColor,
                    border: gridStyle.showBorder ? `1px solid ${gridStyle.borderColor}` : 'none'
                  }}
                >
                  <span 
                    className="w-full text-center break-all line-clamp-3 font-medium leading-[1.1] text-[22px]"
                    style={{ 
                      fontFamily: gridStyle.fontFamily === 'rounded' 
                        ? "'Jua', sans-serif" 
                        : gridStyle.fontFamily === 'thick' 
                          ? "'Black Han Sans', sans-serif" 
                          : "'Inter', sans-serif"
                    }}
                  >
                    {gridData[r][c]}
                  </span>
                </div>
              ))}
            </React.Fragment>
          ))}
          </div>
        </div>
      </div>

      {/* Custom Text & Watermark */}
      {!isEditMode && (
        <div 
          className="absolute bottom-6 inset-x-4 flex flex-col items-center gap-1 opacity-60 pointer-events-none"
          style={{ 
            color: gridStyle.fontColor,
            fontFamily: gridStyle.fontFamily === 'rounded' 
              ? "'Jua', sans-serif" 
              : gridStyle.fontFamily === 'thick' 
                ? "'Black Han Sans', sans-serif" 
                : "'Inter', sans-serif"
          }}
        >
          {customText.school && <p className="text-[9px] font-bold tracking-widest">{customText.school}</p>}
          {(customText.gradeClass || customText.subject) && (
            <p className="text-[8px] opacity-80">{customText.gradeClass} {customText.subject}</p>
          )}
        </div>
      )}
    </div>
  );
}
