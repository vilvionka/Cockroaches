import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RadioCommBox } from './RadioCommBox';
import { COMMANDER_GAMEOVER_LINE } from '../store/storyData';
import { showRewardedAd } from '../utils/yandexAds';
import styles from '../App.module.css';

const ENEMY_KEYS_ORDER = [
  { key: 'normal', fallbackSprite: './cockroach.png' },
  { key: 'ant', fallbackSprite: './ant.png' },
  { key: 'beetle', fallbackSprite: './beetle.png' },
  { key: 'fly', fallbackSprite: './fly.png' },
  { key: 'rhino', fallbackSprite: './rhino.png' },
  { key: 'boss', fallbackSprite: './queen_cockroach.png' },
];

const REQUIRED_REVIVE_ADS = 3;

export const GameOverModal = () => {
  const gameOver = useGameStore((state) => state.gameOver);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const waveCheckpoint = useGameStore((state) => state.waveCheckpoint);
  const reviveAdsWatched = useGameStore((state) => state.reviveAdsWatched || 0);
  const killedStats = useGameStore((state) => state.killedStats);
  const enemyTypes = useGameStore((state) => state.enemyTypes);

  const restartGame = useGameStore((state) => state.restartGame);
  const incrementReviveAd = useGameStore((state) => state.incrementReviveAd);
  const restoreWaveCheckpoint = useGameStore((state) => state.restoreWaveCheckpoint);

  const [isLoadingAd, setIsLoadingAd] = useState(false);

  if (!gameOver) return null;

  const canReviveAtWave =
    Boolean(waveCheckpoint) &&
    waveCheckpoint.currentLevel === currentLevel &&
    waveCheckpoint.levelWaveNumber >= 1;

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

  const handleWatchReviveAd = () => {
    if (isLoadingAd || !canReviveAtWave) return;
    setIsLoadingAd(true);

    showRewardedAd({
      onRewarded: () => {
        const nextCount = useGameStore.getState().reviveAdsWatched + 1;
        if (nextCount >= REQUIRED_REVIVE_ADS) {
          restoreWaveCheckpoint();
        } else {
          incrementReviveAd();
        }
      },
      onClose: () => {
        setIsLoadingAd(false);
      }
    });
  };

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

        <div className={styles.gameover_actions}>
          {canReviveAtWave && (
            <button
              type="button"
              disabled={isLoadingAd}
              onClick={handleWatchReviveAd}
              className={styles.gameover_revive_btn}
            >
              {isLoadingAd
                ? 'ЗАГРУЗКА ТРАНСЛЯЦИИ...'
                : `▶ ВОССТАНОВИТЬ ВОЛНУ ${waveCheckpoint.levelWaveNumber} (${reviveAdsWatched}/${REQUIRED_REVIVE_ADS} РЕКЛАМЫ)`}
            </button>
          )}

          <button
            type="button"
            disabled={isLoadingAd}
            onClick={restartGame}
            className={styles.gameover_restart_btn}
          >
            ПЕРЕЗАПУСТИТЬ ОБОРОНУ (С 1 ВОЛНЫ)
          </button>
        </div>
      </div>
    </div>
  );
};
