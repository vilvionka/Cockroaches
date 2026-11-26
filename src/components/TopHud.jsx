import React, { useState, useEffect } from 'react';
import { useGameStore, LEVELS_CONFIG } from '../store/gameStore';
import styles from '../App.module.css';

export const TopHud = () => {
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [expandedType, setExpandedType] = useState(null);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const currentLevel = useGameStore((state) => state.currentLevel);
  const levelWaveNumber = useGameStore((state) => state.levelWaveNumber);
  const cakeHp = useGameStore((state) => state.cakeHp);
  const maxCakeHp = useGameStore((state) => state.maxCakeHp || 100);
  const waveActive = useGameStore((state) => state.waveActive);
  const waveTimer = useGameStore((state) => state.waveTimer);
  const isUserPaused = useGameStore((state) => state.isUserPaused);

  const enemies = useGameStore((state) => state.enemies);
  const spawnQueue = useGameStore((state) => state.spawnQueue);
  const enemyTypes = useGameStore((state) => state.enemyTypes);

  const togglePause = useGameStore((state) => state.togglePause);
  const restartGame = useGameStore((state) => state.restartGame);

  useEffect(() => {
    if (!waveActive) {
      setIsIntelOpen(false);
      setExpandedType(null);
    }
  }, [waveActive]);

  const maxWaves = LEVELS_CONFIG[currentLevel]?.maxWaves || 6;
  const displayWave = waveActive ? levelWaveNumber : Math.min(maxWaves, levelWaveNumber + 1);

  // Собираем уникальные виды жуков текущей волны
  const allWaveEnemies = [...enemies, ...spawnQueue];
  const uniqueWaveEnemies = [];
  const seenKeys = new Set();

  allWaveEnemies.forEach((enemy) => {
    const uniqueKey = enemy.type === 'boss' ? `boss_${enemy.bossSpeciesSource}` : enemy.type;
    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      const baseConfig = enemyTypes[enemy.type] || {};
      uniqueWaveEnemies.push({
        key: uniqueKey,
        name: enemy.name || baseConfig.name || enemy.type,
        spritePath: enemy.spritePath || baseConfig.spritePath,
        description: enemy.description || baseConfig.description,
        hp: enemy.maxHp,
        missChance: enemy.missChance ?? baseConfig.missChance ?? 0
      });
    }
  });

  const toggleAccordion = (key) => {
    setExpandedType((prev) => (prev === key ? null : key));
  };

  const handleRestartClick = () => {
    setConfirmRestart(false);
    setIsIntelOpen(false);
    window.ysdk?.features?.GameplayAPI?.start();
    restartGame();
  };

  const [radarPing, setRadarPing] = useState(false);

  useEffect(() => {
    const handleIntelPing = () => {
      setRadarPing(true);
      setTimeout(() => setRadarPing(false), 750);
    };
    window.addEventListener('radar-intel-received', handleIntelPing);
    return () => window.removeEventListener('radar-intel-received', handleIntelPing);
  }, []);


  return (
    <>
      <div className={styles.hud_container}>
        <div className={styles.top_hud}>
          {/* Прогресс волн уровня вместо очков */}
          <div className={styles.hud_score}>
            <span className={styles.hud_label}>ВОЛНА:</span>
            <span className={styles.hud_value_cyan}>
              {displayWave}/{maxWaves}
            </span>
          </div>

          {/* Статус волны */}
          <div className={styles.hud_timer}>
            {waveActive ? (
              <button
                type="button"
                onClick={() => setIsIntelOpen((prev) => !prev)}
                className={`${styles.hud_wave_btn} ${radarPing ? styles.hud_wave_btn_ping : ''}`}
                data-open={isIntelOpen}
                title="Показать врагов текущей волны"
              >

                <span className={styles.hud_wave_btn_label}>ВРАГИ</span>
                <span className={styles.hud_radar_pill}>
                  {uniqueWaveEnemies.length}
                  <span className={styles.hud_radar_caret}>{isIntelOpen ? '▲' : '▼'}</span>
                </span>
              </button>
            ) : (
              <>
                <span className={styles.hud_label}>ДО ВОЛНЫ:</span>
                <span className={styles.hud_value_gold}>{Math.ceil(waveTimer / 60)} сек</span>
              </>
            )}
          </div>

          {/* Блок здоровья базы */}
          <div className={styles.hud_hp_block}>
            <span className={styles.hud_label}>БАЗА:</span>
            <div className={styles.hp_bar_bg}>
              <div
                className={styles.hp_bar_fill}
                style={{ width: `${(cakeHp / maxCakeHp) * 100}%` }}
              />
            </div>
            <span className={styles.hp_text}>{cakeHp}</span>
          </div>

          {/* Кнопки управления справа (Пауза и Рестарт) */}
          <div className={styles.hud_controls}>
            <button
              type="button"
              onClick={togglePause}
              className={styles.hud_icon_btn}
              data-active={isUserPaused}
              title={isUserPaused ? 'Продолжить игру' : 'Пауза'}
            >
              {isUserPaused ? '▶' : '⏸'}
            </button>

            <button
              type="button"
              onClick={() => setConfirmRestart(true)}
              className={`${styles.hud_icon_btn} ${styles.hud_restart_icon}`}
              title="Начать заново"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Выпадающий список врагов волны */}
        {waveActive && isIntelOpen && (
          <div className={styles.hud_intel_dropdown}>
            <div className={styles.intel_header}>
              <span>СОСТАВ ТЕКУЩЕЙ ВОЛНЫ</span>
              <button
                type="button"
                onClick={() => setIsIntelOpen(false)}
                className={styles.intel_close_x}
              >
                ✕
              </button>
            </div>

            <div className={styles.intel_list}>
              {uniqueWaveEnemies.map((item) => {
                const isExpanded = expandedType === item.key;

                return (
                  <div key={item.key} className={styles.intel_item} data-expanded={isExpanded}>
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.key)}
                      className={styles.intel_item_header}
                    >
                      <div className={styles.intel_item_left}>
                        <div
                          className={styles.intel_sprite}
                          style={{ backgroundImage: `url(${item.spritePath})` }}
                        />
                        <span className={styles.intel_name}>{item.name}</span>
                      </div>
                      <span className={styles.intel_arrow}>{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                      <div className={styles.intel_accordion_body}>
                        <div className={styles.intel_mini_stats}>
                          <span>HP: <b>{item.hp}</b></span>
                          <span>УКЛОНЕНИЕ: <b>{Math.round(item.missChance * 100)}%</b></span>
                        </div>
                        <p className={styles.intel_desc}>{item.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>



      {/* Компактное окно подтверждения рестарта */}
      {confirmRestart && (
        <div className={styles.pause_overlay}>
          <div className={styles.pause_card}>
            <div className={styles.lvl_complete_badge}>СБРОС СЕКТОРА</div>
            <h2 className={styles.pause_title}>НАЧАТЬ ЗАНОВО?</h2>
            <div className={styles.confirm_btn_row}>
              <button onClick={handleRestartClick} className={styles.confirm_yes_btn}>
                ДА, СБРОС
              </button>
              <button onClick={() => setConfirmRestart(false)} className={styles.confirm_no_btn}>
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
