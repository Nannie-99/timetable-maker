# Screen Structure Guide

## 1. App Layout
- **Header**: Title "시간표 메이커" and version info.
- **Main Content**:
  - **Preview Area**: `PreviewCanvas` component.
    - **Background Layer**: User-selected theme or custom image.
    - **Grid Layer**: The timetable itself.
    - **Footer Info**: School name, grade/class, subject.
  - **Controls Area**: `Controls` component.
    - **Tabs**: 시간표 (Timetable), 배경 (Background), 스타일 (Style), 디테일 (Detail).
- **Bottom Action**: "배경화면 다운로드" (Download Wallpaper) button.

## 2. Tabs Breakdown
### 시간표 (Timetable)
- 교시 수 조절 (1-8).
- 각 교시/요일별 과목 입력.
- 미리보기: 스크롤 없이 한눈에 볼 수 있도록 자동 스케일링 적용.
- 헤더의 "교시" 텍스트 삭제.

### 배경 (Background)
- 화면 비율 선택 (9:16, 9:19.5, 9:20).
- 배경 테마 선택 (모던, 키치, 사이버 등 가나다순 정렬).
- 나의 사진 업로드 기능.
- 배경 크기 (Zoom): 100-250% 조절 및 초기화.
- 배경 어둡기 (Dim): 0-100%.

### 스타일 (Style)
- **4가지 아코디언 섹션**:
  1. **셀 스타일**:
     - 칸 색상 (색상 없음 On/Off + 색상 피커).
     - 셀 투명도 (0-100%).
  2. **테두리 스타일**:
     - 테두리 색상 (테두리 없음 On/Off + 색상 피커).
     - 둥글기 (없음, 조금, 많이).
  3. **텍스트 스타일**:
     - 텍스트 색상 피커.
     - 글꼴 선택 (기본, 둥근, 두꺼운).
  4. **크기 및 위치**:
     - **크기 조절**: 100-240% (초기화 170%, 중앙값).
     - **위치 조절 (X축)**: 0-94% (초기화 47%, 중앙값).
     - **위치 조절 (Y축)**: 20-130% (초기화 64%, 2/5 지점).

### 디테일 (Detail)
- 수업 시간 표시 On/Off (On일 때만 교시 행 숫자 가운데 정렬).
- 시간 입력 (각 교시별 시작/종료).
- 추가 텍스트 입력 (학교, 학년/반, 이름/기타).
- **일괄 초기화**: 모든 데이터와 스타일을 초기 기본값으로 리셋.
