import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RadioCommBox } from './RadioCommBox';
import { COMMANDER_GAMEOVER_LINE } from '../store/storyData';
import styles from '../App.module.css';

const ENEMY_KEYS_ORDER = [
  { key: 'normal', fallbackSprite: './cockroach.png' },
  { key: 'ant', fallbackSprite: './ant.png' },
  { key: 'beetle', fallbackSprite: './beetle.png' },
  { key: 'fly', fallbackSprite: './fly.png' },
  { key: 'rhino', fallbackSprite: './rhino.png' },
  { key: 'boss', fallbackSprite: './queen_cockroach.png' },
];

export const GameOverModal = () => {
  const gameOver = useGameStore((state) => state.gameOver);
  const killedStats = useGameStore((state) => state.killedStats);
  const enemyTypes = useGameStore((state) => state.enemyTypes);
  const restartGame = useGameStore((state) => state.restartGame);

  if (!gameOver) return null;

  const killedEnemiesList = ENEMY_KEYS_ORDER
    .filter((item) => (killedStats?.[item.key] || 0) > 0)
    .map((item) => {
      const config = enemyTypes?.[item.key] || {};
      return {
        key: item.key,
        label: config.name || item.key,
        sprite: config.spritePath || item.fallbackSprite,
        count: killedStats[item.key]
      };
    });

  return (
    <div className={styles.gameover_overlay}>
      <div
        className={styles.gameover_poster_bg}
        style={{ backgroundImage: "url('./story_gameover.jpg')" }}
      />
      <div className={styles.gameover_poster_vignette} />

      <div className={styles.gameover_card} style={{ width: '430px', position: 'relative', zIndex: 2 }}>
        <div className={styles.gameover_subtitle}>СИСТЕМА ОБОРОНЫ ПРОРВАНА</div>
        <h1 className={styles.gameover_title}>GAME OVER</h1>

        <div style={{ width: '100%', marginBottom: '12px' }}>
          <RadioCommBox
            speakerKey="commander"
            badge="ЭКСТРЕННАЯ СВЯЗЬ // БАЗА ПОТЕРЯНА"
            text={COMMANDER_GAMEOVER_LINE}
            alertMode={true}
          />
        </div>

        {killedEnemiesList.length > 0 && (
          <>
            <div className={styles.gameover_stats_header}>ОТЧЕТ ПО УНИЧТОЖЕННЫМ ЦЕЛЯМ</div>

            <div className={styles.gameover_list}>
              {killedEnemiesList.map((item) => (
                <div key={item.key} className={styles.gameover_row}>
                  <div className={styles.gameover_enemy_info}>
                    <div
                      className={styles.gameover_sprite_icon}
                      style={{ backgroundImage: `url(${item.sprite})` }}
                    />
                    <span className={styles.gameover_enemy_name}>{item.label}</span>
                  </div>
                  <div className={styles.gameover_dash}>—</div>
                  <div className={styles.gameover_count}>{item.count}</div>
                </div>
              ))}
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
