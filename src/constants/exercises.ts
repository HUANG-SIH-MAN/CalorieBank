import { ExerciseType } from '../types';

export const EXERCISE_TYPES: ExerciseType[] = [
  { id: 'WALKING', name: '散步', met: 3.5, icon: 'walking' },
  { id: 'RUNNING', name: '跑步', met: 8.0, icon: 'running' },
  { id: 'CYCLING', name: '騎單車', met: 6.0, icon: 'bicycle' },
  { id: 'SWIMMING', name: '游泳', met: 7.0, icon: 'swimmer' },
  { id: 'STRENGTH', name: '重訓', met: 5.0, icon: 'dumbbell' },
  { id: 'YOGA', name: '瑜珈', met: 2.5, icon: 'pray' },
  { id: 'JUMP_ROPE', name: '跳繩', met: 10.0, icon: 'skiing' },
  { id: 'TREADMILL', name: '跑步機', met: 9.0, icon: 'running' },
  { id: 'ELLIPTICAL', name: '滑步機', met: 5.0, icon: 'walking' },
  { id: 'BASKETBALL', name: '打籃球', met: 8.0, icon: 'basketball-ball' },
  { id: 'HIIT', name: '高強度間歇', met: 11.0, icon: 'fire-alt' },
];
