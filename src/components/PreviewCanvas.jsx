import React, { useMemo, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PRESETS = {
  modern: 'bg-cover bg-center bg-[url("/backgrounds/modern.png")]',
  kitsch: 'bg-cover bg-center bg-[url("/backgrounds/kitsch.png")]',
  cyber: 'bg-cover bg-center bg-[url("/backgrounds/cyber.png")]',
  coffee: 'bg-cover bg-center bg-[url("/backgrounds/coffee.png")]',
  simple: 'bg-cover bg-center bg-[url("/backgrounds/simple.png")]',
  pixel: 'bg-cover bg-center bg-[url("/backgrounds/pixel.png")]',
  yoonseul: 'bg-cover bg-center bg-[url("/backgrounds/nature.png")]',
  lemon: 'bg-cover bg-center bg-[url("/backgrounds/lemon.png")]',
  retro: 'bg-cover bg-center bg-[url("/backgrounds/retro.png")]',
  ducks: 'bg-cover bg-center bg-[url("/backgrounds/ducks.png")]',
  tomato: 'bg-cover bg-center bg-[url("/backgrounds/tomato.png")]',
  pudding: 'bg-cover bg-center bg-[url("/backgrounds/pudding.png")]',
  koi: 'bg-cover bg-center bg-[url("/backgrounds/koi.png")]',
  dog: 'bg-cover bg-center bg-[url("/backgrounds/dog.png")]',
};

export default function PreviewCanvas({ state, updateState, canvasRef }) {
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
      // Use the actual rendered width of the wallpaper/container
      setAutoScale(rect.width / BASE_WIDTH);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(canvasRef.current);
    updateScale();
    
    return () => observer.disconnect();
  }, [canvasRef]);

  const currentRatio = useMemo(() => {
    if (aspectRatio === '9:19.5') return '9 / 19.5';
    if (aspectRatio === '9:20') return '9 / 20';
    return '9 / 16';
  }, [aspectRatio]);

  const backgroundStyle = useMemo(() => {
    if (isEditMode) return 'bg-[#111]';
    if (bgType === 'preset') return PRESETS[bgValue] || PRESETS.modern;
    if (bgType === 'custom') return `bg-cover bg-center`;
    return '';
  }, [bgType, bgValue, isEditMode]);

  const customBgStyle = bgType === 'custom' && !isEditMode ? { backgroundImage: `url(${bgValue})` } : {};
  
  // Combine user transform and the modern-only extra scale
  const finalScale = bgTransform.scale * (bgValue === 'modern' ? 1.1 : 1);
  const transformStyle = {
    transform: `translate(${bgTransform.x}px, ${bgTransform.y}px) scale(${finalScale})`,
    ...customBgStyle
  };

  const containerStyle = { 
    aspectRatio: currentRatio,
  };

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
    
    // Prevent default to disable scrolling while dragging on mobile
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
  // This ensures the background image stays within the canvas area
  useEffect(() => {
    if (isEditMode || !canvasRef.current || bgType !== 'preset' && bgType !== 'custom') return;

    const container = canvasRef.current;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // The image is scaled by finalScale (from line 64)
    const currentScale = finalScale;
    const imageWidth = containerWidth * currentScale;
    const imageHeight = containerHeight * currentScale;

    // Max allowed displacement (half of the extra width/height)
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


  // Calculate a scale specifically for Edit Mode to ensure the entire grid is visible regardless of period count
  const editScale = useMemo(() => {
    if (!canvasRef.current || !isEditMode) return autoScale * 0.9;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 40; // Reduced padding for better space utilization in Edit Mode
    const containerWidth = rect.width - padding;
    const containerHeight = rect.height - padding;
    
    // Grid dimensions at scale 1
    const gridWidth = BASE_WIDTH;
    const cellWidth = (BASE_WIDTH - 40) / 6; // 6 columns, 5 gaps of 8px
    const cellHeight = cellWidth / 1.7;
    const gridHeight = (periods + 1) * cellHeight + (periods * 8); // periods+1 rows, periods gaps
    
    const sX = containerWidth / gridWidth;
    const sY = containerHeight / gridHeight;
    
    return Math.min(sX, sY);
  }, [autoScale, periods, isEditMode, canvasRef]);

  return (
    <div 
      ref={canvasRef}
      className={cn(
        "relative shadow-2xl transition-all duration-500 bg-[#1a1a1a]",
        isEditMode ? "h-full w-full flex flex-col items-center justify-center p-4 bg-[#111] overflow-auto" : "h-full w-auto max-w-full rounded-3xl overflow-hidden"
      )}
      style={!isEditMode ? containerStyle : {}}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Background Layer (Preview Only) */}
      {!isEditMode && (
        <>
          <div 
            className={cn(
              "absolute inset-0 transition-transform duration-150 ease-out",
              backgroundStyle,
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={transformStyle}
          />
          {/* Optimization: Hidden image for better browser priority handling */}
          {bgType === 'preset' && (
            <img 
              src={`/backgrounds/${bgValue === 'modern' ? 'modern' : bgValue}.png`}
              className="hidden" 
              alt=""
              fetchpriority="high"
            />
          )}
        </>
      )}

      {/* Background Dim Layer (Preview Only) */}
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
            // In Edit mode, we fit the grid to 100% of available space.
            // Requirement updated: 1.3x larger than the previous 1.5x version.
            // New Preview Scale (at 170%): 0.675 * 1.3 = autoScale * 0.8775
            transform: `translate(${!isEditMode ? (gridStyle.xPosition || 50) - 50 : 0}%, ${!isEditMode ? gridStyle.yPosition - 50 : 0}%) scale(${isEditMode ? editScale : (autoScale * 0.8775 * (gridStyle.scale / 170))})`,
            width: `${BASE_WIDTH}px`,
            maxWidth: 'none', // Allow full scaling
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
                  "flex items-center justify-center text-[16px] font-bold opacity-40 transition-all duration-300",
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
                    "flex flex-col justify-center text-[16px] font-bold opacity-60 transition-all duration-300",
                    showTimes ? "items-center" : "items-end pr-3",
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
                  <span>{r + 1}</span>
                  {showTimes && (
                    <span className="text-[12px] leading-tight text-center">
                      {times[r]?.start}<br/>{times[r]?.end}
                    </span>
                  )}
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

      {/* Custom Text & Watermark (Preview Only) */}
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

      {/* No Watermark as requested */}
    </div>
  );
}
