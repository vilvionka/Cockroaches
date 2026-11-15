import React from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const LevelCompleteModal = () => {
  const levelTransition = useGameStore((state) => state.levelTransition);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const score = useGameStore((state) => state.score);

  if (!levelTransition) return null;

  return (
    <div className={styles.lvl_complete_overlay}>
      <div className={styles.lvl_complete_card}>
        <div className={styles.lvl_complete_badge}>СЕКТОР {currentLevel} ЗАЧИЩЕН</div>
        <h2 className={styles.lvl_complete_title}>УРОВЕНЬ УСПЕШНО ПРОЙДЕН</h2>

        <div className={styles.lvl_complete_score_row}>
          <span className={styles.lvl_complete_label}>ТЕКУЩИЙ СЧЁТ:</span>
          <span className={styles.lvl_complete_val}>{score}</span>
        </div>

        <div className={styles.lvl_complete_hint}>
          Нажмите кнопку «Начать» на панели справа, чтобы продолжить
        </div>
      </div>
    </div>
  );
};
