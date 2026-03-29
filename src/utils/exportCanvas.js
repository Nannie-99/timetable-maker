/**
 * exportCanvas.js
 * Canvas 2D API를 사용해 배경화면을 정확히 렌더링합니다.
 * html2canvas 대신 사용하여 CSS transform/scale 왜곡 문제를 근본적으로 해결합니다.
 */

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function getFontFamily(fontFamily) {
  if (fontFamily === 'rounded') return "'Jua', sans-serif";
  if (fontFamily === 'thick') return "'Black Han Sans', sans-serif";
  return "'Inter', sans-serif";
}

/**
 * 배경화면 캔버스를 생성합니다.
 * @param {object} state - 앱 전체 상태
 * @param {DOMRect} containerRect - PreviewCanvas의 getBoundingClientRect() 결과
 * @param {HTMLElement} containerEl - PreviewCanvas DOM 요소
 * @returns {HTMLCanvasElement}
 */
export async function generateWallpaperCanvas(state, containerRect, containerEl) {
  const {
    aspectRatio, bgType, bgValue, bgDim, bgTransform,
    gridStyle, gridData, periods, showTimes, times, customText,
  } = state;

  // ── 1. 출력 해상도 결정 ──────────────────────────────────────────
  const ratioH = aspectRatio === '9:19.5' ? 19.5 : aspectRatio === '9:20' ? 20 : 16;
  const TARGET_W = 1080;
  const TARGET_H = Math.round(TARGET_W * ratioH / 9);

  const previewW = containerRect.width;
  const previewH = containerRect.height;
  // preview CSS 픽셀 → export 픽셀 변환 비율
  const pxRatio = TARGET_W / previewW;

  // ── 2. 오프스크린 캔버스 생성 ────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext('2d');

  // ── 3. 배경 렌더링 (Canvas 2D - CSS transform 왜곡 없음) ─────────
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, TARGET_W, TARGET_H);

  if (bgType === 'preset' || bgType === 'custom') {
    const src = bgType === 'preset'
      ? (PRESET_FILES[bgValue] || PRESET_FILES['강아지'])
      : bgValue;

    try {
      const img = await loadImage(src);

      // CSS:  <div style="transform: translate(tx,ty) scale(s); w:100%; h:100%">
      //         <img class="w-full h-full object-cover" />
      //       </div>
      // 이를 Canvas 2D drawImage로 정확히 재현합니다.

      const s = bgTransform.scale;

      // preview 기준 scaled container 크기 → export 기준으로 변환
      const scaledContainerW = TARGET_W * s;
      const scaledContainerH = TARGET_H * s;

      // bgTransform.x,y는 preview CSS px 단위이므로 pxRatio로 변환
      const txExport = bgTransform.x * pxRatio;
      const tyExport = bgTransform.y * pxRatio;

      // scale()은 요소 중심 기준으로 적용됨 (transform-origin: 50% 50%)
      const containerLeft = (TARGET_W - scaledContainerW) / 2 + txExport;
      const containerTop  = (TARGET_H - scaledContainerH) / 2 + tyExport;

      // object-fit: cover 재현: 이미지 비율 유지하며 scaled container를 꽉 채움
      const imgAspect       = img.naturalWidth / img.naturalHeight;
      const containerAspect = scaledContainerW / scaledContainerH;

      let drawW, drawH, drawX, drawY;
      if (imgAspect > containerAspect) {
        // 이미지가 더 넓음 → 높이 기준으로 맞춤, 좌우 넘침
        drawH = scaledContainerH;
        drawW = drawH * imgAspect;
        drawX = containerLeft + (scaledContainerW - drawW) / 2;
        drawY = containerTop;
      } else {
        // 이미지가 더 높음 → 너비 기준으로 맞춤, 상하 넘침
        drawW = scaledContainerW;
        drawH = drawW / imgAspect;
        drawX = containerLeft;
        drawY = containerTop + (scaledContainerH - drawH) / 2;
      }

      // 캔버스 경계 밖으로 넘치지 않도록 클립
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, TARGET_W, TARGET_H);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (e) {
      console.warn('[exportCanvas] 배경 이미지 로드 실패:', e);
    }
  }

  // ── 4. 딤(어둡게) 오버레이 ───────────────────────────────────────
  if (bgDim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${bgDim})`;
    ctx.fillRect(0, 0, TARGET_W, TARGET_H);
  }

  // ── 5. 그리드 셀 렌더링 ──────────────────────────────────────────
  // getBoundingClientRect()로 실제 렌더링 위치(모든 transform 반영)를 측정합니다.
  await document.fonts.ready; // 폰트 로드 완료 대기

  const fontFamily = getFontFamily(gridStyle.fontFamily);

  // data-timetable-cell 속성이 있는 모든 셀 조회
  const allCells = containerEl.querySelectorAll('[data-timetable-cell]');

  allCells.forEach(cell => {
    const r = cell.getBoundingClientRect();

    // preview 좌표 → export 좌표
    const x = (r.left - containerRect.left) * pxRatio;
    const y = (r.top  - containerRect.top)  * pxRatio;
    const w = r.width  * pxRatio;
    const h = r.height * pxRatio;

    // CSS border-radius를 실제 셀 높이 비율로 환산 (원래 CSS: 51px 기준)
    const cssH = 51; // 셀의 CSS 기본 높이
    const radiusScale = h / cssH;
    const borderRadius =
      gridStyle.roundness === 'lot'  ? 22 * radiusScale :
      gridStyle.roundness === 'some' ?  8 * radiusScale : 0;

    const type = cell.dataset.timetableCell; // 'header' | 'number' | 'content'

    if (type === 'content') {
      // 셀 배경
      if (gridStyle.showCellBg) {
        ctx.save();
        ctx.globalAlpha = gridStyle.opacity;
        ctx.fillStyle = gridStyle.cellColor;
        drawRoundRect(ctx, x, y, w, h, borderRadius);
        ctx.fill();
        ctx.restore();
      }

      // 테두리
      if (gridStyle.showBorder) {
        ctx.save();
        ctx.strokeStyle = gridStyle.borderColor;
        ctx.lineWidth = Math.max(1, pxRatio);
        drawRoundRect(ctx, x, y, w, h, borderRadius);
        ctx.stroke();
        ctx.restore();
      }

      // 텍스트
      const span = cell.querySelector('span');
      const text = span?.textContent?.trim() || '';
      if (text) {
        // CSS font-size: 18px, 셀 높이 비율로 환산
        const fontSize = Math.round(18 * radiusScale);
        ctx.save();
        ctx.font = `500 ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = gridStyle.fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.restore();
      }

    } else if (type === 'header') {
      // 요일 헤더
      const span = cell.querySelector('span');
      const text = span?.textContent?.trim() || '';
      if (text) {
        const fontSize = Math.round(17 * radiusScale);
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = gridStyle.fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.restore();
      }

    } else if (type === 'number') {
      // 교시 번호
      const spans = cell.querySelectorAll('span');
      const periodNum = spans[0]?.textContent?.trim() || '';
      const fontSize = Math.round(17 * radiusScale);

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = gridStyle.fontColor;
      ctx.textAlign = showTimes ? 'center' : 'right';
      ctx.textBaseline = 'middle';

      if (showTimes && spans.length > 1) {
        // 교시번호 위, 시간 아래
        ctx.textBaseline = 'alphabetic';
        const smallFontSize = Math.round(10 * radiusScale);
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillText(periodNum, x + w / 2, y + h / 2 - fontSize * 0.3);
        ctx.font = `${smallFontSize}px ${fontFamily}`;
        const [startStr, endStr] = [spans[1]?.textContent?.trim() || '', spans[2]?.textContent?.trim() || ''];
        ctx.fillText(`${startStr} ${endStr}`, x + w / 2, y + h / 2 + fontSize * 0.5);
      } else {
        ctx.fillText(periodNum, x + w - 4 * radiusScale, y + h / 2);
      }
      ctx.restore();
    }
  });

  // ── 6. 하단 커스텀 텍스트 ────────────────────────────────────────
  const hasCustomText = customText.school || customText.gradeClass || customText.subject;
  if (hasCustomText) {
    const fontFamily2 = getFontFamily(gridStyle.fontFamily);
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = gridStyle.fontColor;
    ctx.textAlign = 'center';

    const baseY = TARGET_H - 40 * pxRatio;
    let lineY = baseY;

    if (customText.school) {
      const fs = Math.round(9 * pxRatio);
      ctx.font = `bold ${fs}px ${fontFamily2}`;
      ctx.fillText(customText.school, TARGET_W / 2, lineY);
      lineY += fs * 1.6;
    }
    const sub = [customText.gradeClass, customText.subject].filter(Boolean).join(' ');
    if (sub) {
      const fs = Math.round(8 * pxRatio);
      ctx.globalAlpha = 0.48;
      ctx.font = `${fs}px ${fontFamily2}`;
      ctx.fillText(sub, TARGET_W / 2, lineY);
    }
    ctx.restore();
  }

  return canvas;
}
