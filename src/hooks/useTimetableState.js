import { useState, useEffect } from 'react';

const STORAGE_KEY = 'timetable_maker_v1.1';

const INITIAL_DATA = {
  periods: 6,
  days: 5,
  bgValue: 'modern',
  bgDim: 0.3,
  gridData: Array(8).fill(null).map(() => Array(5).fill('')),
  times: Array(8).fill(null).map(() => ({ start: '09:00', end: '09:50' })),
  gridStyle: {
    showBorder: true,
    borderColor: '#ffffff',
    roundness: 'some',
    opacity: 0.9,
    scale: 170, // percentage 100 - 240
    xPosition: 48,
    yPosition: 65,
    fontFamily: 'default',
    showCellBg: true,
    cellColor: '#ffffff',
    textColor: '#ffffff',
    fontColor: '#ffffff',
    fontFamily: 'gothic',
  },
  bgTransform: {
    scale: 1,
    x: 0,
    y: 0,
  },
  showTimes: false,
  customText: {
    school: '',
    gradeClass: '',
    subject: '',
  },
  activeTab: 1,
};

export function useTimetableState() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const updateGridCell = (period, day, value) => {
    const newData = [...state.gridData];
    newData[period] = [...newData[period]];
    newData[period][day] = value;
    updateState({ gridData: newData });
  };

  const updateTime = (period, type, value) => {
    const newTimes = [...state.times];
    newTimes[period] = { ...newTimes[period], [type]: value };
    updateState({ times: newTimes });
  };

  const resetState = () => {
    setState(INITIAL_DATA);
  };

  return {
    state,
    updateState,
    updateGridCell,
    updateTime,
    resetState,
  };
}
