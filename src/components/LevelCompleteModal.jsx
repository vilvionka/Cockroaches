import React from 'react';
import { useGameStore, LEVELS_CONFIG } from '../store/gameStore';
import styles from '../App.module.css';

export const LevelCompleteModal = () => {
  const levelTransition = useGameStore((state) => state.levelTransition);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const nextIncomingLevel = useGameStore((state) => state.nextIncomingLevel);
  const score = useGameStore((state) => state.score);
  const nextLevel = useGameStore((state) => state.nextLevel);

  if (!levelTransition) return null;

  const isGameCompleted = !LEVELS_CONFIG[nextIncomingLevel];

  return (
    <div className={styles.lvl_complete_overlay}>
      <div className={styles.lvl_complete_card}>
        <div className={styles.lvl_complete_badge}>
          {isGameCompleted ? 'ВСЕ СЕКТОРЫ ЗАЧИЩЕНЫ // ПОБЕДА' : `СЕКТОР ${currentLevel} ЗАЧИЩЕН`}
        </div>

        <h2 className={styles.lvl_complete_title}>
          {isGameCompleted ? 'ПОЗДРАВЛЯЕМ! ИГРА ПРОЙДЕНА' : 'УРОВЕНЬ УСПЕШНО ПРОЙДЕН'}
        </h2>

        <div className={styles.lvl_complete_score_row}>
          <span className={styles.lvl_complete_label}>
            {isGameCompleted ? 'ИТОГОВЫЙ СЧЁТ:' : 'ТЕКУЩИЙ СЧЁТ:'}
          </span>
          <span className={styles.lvl_complete_val}>{score}</span>
        </div>

        {isGameCompleted ? (
          <button
            type="button"
            onClick={nextLevel}
            className={styles.supply_claim_btn}
            style={{ width: '100%', marginTop: '4px' }}
          >
            НАЧАТЬ НОВУЮ ИГРУ
          </button>
        ) : (
          <div className={styles.lvl_complete_hint}>
            Нажмите кнопку «Начать» на панели справа, чтобы продолжить
          </div>
        )}
      </div>
    </div>
  );
};
