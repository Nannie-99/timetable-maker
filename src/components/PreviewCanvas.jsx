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
        "relative transition-all duration-500 bg-[#1a1a1a]",
        !isExporting && "rounded-3xl", // Pure rectangle for export
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
      {/* Background Layer (IMG with object-fit for high-res direct capture) */}
      {!isEditMode && (
        <div 
          className={cn(
            "absolute inset-0 transition-transform duration-150 ease-out flex items-center justify-center overflow-hidden",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            transform: `translate(${bgTransform.x}px, ${bgTransform.y}px) scale(${finalScale})`,
            backgroundColor: (bgType !== 'preset' && bgType !== 'custom') ? '#111' : 'transparent',
            width: '100%',
            height: '100%'
          }}
        >
          {(bgType === 'preset' || bgType === 'custom') && (
            <img 
              src={bgImageSource} 
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              style={{
                display: 'block',
                // Preserve original quality markers
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden'
              }}
              crossOrigin="anonymous"
            />
          )}
        </div>
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
          id="preview-capture-area"
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
                backgroundColor: 'transparent',
                border: 'none',
                height: '51px',
                display: 'flex'
              }}
            ></div>
            {['월', '화', '수', '목', '금'].map(day => (
              <div 
                key={day} 
                data-timetable-cell="header"
                className={cn(
                  "flex items-center justify-center text-[17px] font-bold opacity-85 transition-all duration-300",
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
                      height: '51px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span 
                      style={{ 
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1.2',
                        transform: isExporting ? 'translateY(-1.5px)' : 'none'
                      }}
                    >
                      {day}
                    </span>
                  </div>
                ))}

            {/* Rows */}
            {Array.from({ length: periods }).map((_, r) => (
              <React.Fragment key={r}>
                <div 
                  data-timetable-cell="number"
                  className={cn(
                    "flex flex-col items-center justify-center font-bold opacity-85 transition-all duration-300",
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
                        height: '51px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '17px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center" style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: showTimes ? 'center' : 'flex-end', 
                        justifyContent: 'center',
                        paddingRight: showTimes ? '0' : '4px',
                        height: '51px',
                        transform: isExporting ? 'translateY(-6px)' : 'none'
                      }}>
                        <span style={{ display: 'block', lineHeight: '1' }}>{r + 1}</span>
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
                        data-timetable-cell="content"
                        className={cn(
                          "transition-all duration-300 border border-white/5",
                          gridStyle.roundness === 'some' && "rounded-lg",
                          gridStyle.roundness === 'lot' && "rounded-[22px]"
                        )}
                        style={{ 
                          height: '51px',
                          backgroundColor: gridStyle.showCellBg 
                            ? (gridStyle.cellColor + Math.round(gridStyle.opacity * 255).toString(16).padStart(2, '0'))
                            : 'transparent',
                          color: gridStyle.fontColor,
                          border: gridStyle.showBorder ? `1px solid ${gridStyle.borderColor}` : 'none',
                          overflow: 'visible',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span 
                          className="w-full text-center break-words font-medium text-[18px]"
                          style={{ 
                            fontFamily: gridStyle.fontFamily === 'rounded' 
                              ? "'Jua', sans-serif" 
                              : gridStyle.fontFamily === 'thick' 
                                ? "'Black Han Sans', sans-serif" 
                                : "'Inter', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            lineHeight: '1.2',
                            paddingBottom: '2px', // Return to baseline used in preview
                            transform: isExporting ? 'translateY(-6px)' : 'none' // Increase shift to -6px as requested
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
