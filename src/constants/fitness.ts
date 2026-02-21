export const ACTIVITY_LEVELS = [
  { 
    id: 'SEDENTARY', 
    label: '幾乎不運動', 
    desc: '久坐、辦公室工作或整天在家。', 
    detail: '除了日常走動，幾乎沒有刻意運動計畫。',
    factor: 1.2 
  },
  { 
    id: 'LIGHT', 
    label: '輕度活動', 
    desc: '每週運動 1-3 天，或需要站立走動的工作。', 
    detail: '如散步、輕度體育課，或是零售業工作。',
    factor: 1.375 
  },
  { 
    id: 'MODERATE', 
    label: '中度活動', 
    desc: '每週運動 3-5 天，具有一定強度的鍛鍊。', 
    detail: '如慢跑、游泳、中強度重訓，心跳明顯加快的工作。',
    factor: 1.55 
  },
  { 
    id: 'ACTIVE', 
    label: '高度活動', 
    desc: '每週運動 6-7 天，或是高強度的體力勞動。', 
    detail: '重度重訓、馬拉松訓練，或是工地、搬家等勞力工作。',
    factor: 1.725 
  },
];

export const WEIGHT_SPEEDS = [
  { 
    id: 'SLOW', 
    label: '緩慢', 
    desc: '每週約 0.25kg', 
    detail: '每天減少約 250kcal。對於剛開始或體重接近目標的人來說最安全穩定。',
    offset: 250 
  },
  { 
    id: 'STEADY', 
    label: '穩定', 
    desc: '每週約 0.5kg', 
    detail: '每天減少約 500kcal。醫學推薦的最佳平衡速度。',
    offset: 500 
  },
  { 
    id: 'FAST', 
    label: '積極', 
    desc: '每週約 1kg', 
    detail: '每天減少約 1000kcal。挑戰性大，建議在專業指導或健康狀況良好下進行。',
    offset: 1000 
  },
];
