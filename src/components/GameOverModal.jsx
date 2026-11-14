import React from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

const ENEMY_DISPLAY_LIST = [
  { key: 'normal', label: 'Таракан', sprite: '/cockroach.png' },
  { key: 'ant', label: 'Муравей', sprite: '/ant.png' },
  { key: 'beetle', label: 'Жук-броненосец', sprite: '/beetle.png' },
  { key: 'fly', label: 'Муха', sprite: '/fly.png' },
  { key: 'rhino', label: 'Жук-олень', sprite: '/rhino.png' },
  { key: 'boss', label: 'Матка', sprite: '/queen_cockroach.png' },
];

export const GameOverModal = () => {
  const gameOver = useGameStore((state) => state.gameOver);
  const score = useGameStore((state) => state.score);
  const killedStats = useGameStore((state) => state.killedStats);
  const restartGame = useGameStore((state) => state.restartGame);

  if (!gameOver) return null;

  // Оставляем только тех жуков, которых убили хотя бы 1 раз
  const killedEnemiesList = ENEMY_DISPLAY_LIST.filter(
    (item) => (killedStats?.[item.key] || 0) > 0
  );

  return (
    <div className={styles.gameover_overlay}>
      <div className={styles.gameover_card}>
        <div className={styles.gameover_subtitle}>СИСТЕМА ОБОРОНЫ ПРОРВАНА</div>
        <h1 className={styles.gameover_title}>GAME OVER</h1>

        <div className={styles.gameover_total_box}>
          <span className={styles.gameover_total_label}>TOTAL SCORE:</span>
          <span className={styles.gameover_total_value}>{score}</span>
        </div>

        {/* Показываем заголовок и список только если игрок успел кого-то уничтожить */}
        {killedEnemiesList.length > 0 && (
          <>
            <div className={styles.gameover_stats_header}>ОТЧЕТ ПО УНИЧТОЖЕННЫМ ЦЕЛЯМ</div>

            <div className={styles.gameover_list}>
              {killedEnemiesList.map((item) => {
                const count = killedStats[item.key];
                return (
                  <div key={item.key} className={styles.gameover_row}>
                    <div className={styles.gameover_enemy_info}>
                      <div
                        className={styles.gameover_sprite_icon}
                        style={{ backgroundImage: `url(${item.sprite})` }}
                      />
                      <span className={styles.gameover_enemy_name}>{item.label}</span>
                    </div>
                    <div className={styles.gameover_dash}>—</div>
                    <div className={styles.gameover_count}>{count}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <button onClick={restartGame} className={styles.gameover_restart_btn}>
          ПЕРЕЗАПУСТИТЬ ОБОРОНУ
        </button>
      </div>
    </div>
  );
};
