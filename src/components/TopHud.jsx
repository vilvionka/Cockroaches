import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const TopHud = () => {
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [expandedType, setExpandedType] = useState(null);

  const score = useGameStore((state) => state.score);
  const cakeHp = useGameStore((state) => state.cakeHp);
  const maxCakeHp = useGameStore((state) => state.maxCakeHp || 100);
  const waveActive = useGameStore((state) => state.waveActive);
  const waveTimer = useGameStore((state) => state.waveTimer);

  const enemies = useGameStore((state) => state.enemies);
  const spawnQueue = useGameStore((state) => state.spawnQueue);
  const enemyTypes = useGameStore((state) => state.enemyTypes);

  // Автоматически закрываем список, когда волна завершилась
  useEffect(() => {
    if (!waveActive) {
      setIsIntelOpen(false);
      setExpandedType(null);
    }
  }, [waveActive]);

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

  return (
    <div className={styles.hud_container}>
      {/* Декоративные элементы рамки по углам и центрам */}
      <div className={`${styles.hud_decor} ${styles.decor_tl}`} />
      <div className={`${styles.hud_decor} ${styles.decor_tr}`} />
      <div className={`${styles.hud_decor} ${styles.decor_bl}`} />
      <div className={`${styles.hud_decor} ${styles.decor_br}`} />
      <div className={`${styles.hud_decor} ${styles.decor_ct}`} />
      <div className={`${styles.hud_decor} ${styles.decor_cb}`} />

      {/* Основной контент HUD */}
      <div className={styles.top_hud}>
        {/* Блок очков */}
        <div className={styles.hud_score}>
          <span className={styles.hud_label}>ОЧКИ:</span>
          <span className={styles.hud_value_cyan}>{score}</span>
        </div>

        {/* Блок статуса волны: во время отсчета — просто текст, во время волны — кнопка */}
        <div className={styles.hud_timer}>
          {waveActive ? (
            <button
              type="button"
              onClick={() => setIsIntelOpen((prev) => !prev)}
              className={styles.hud_wave_btn}
              data-open={isIntelOpen}
              title="Показать врагов текущей волны"
            >
              <span className={styles.hud_wave_btn_label}>ВОЛНА</span>
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
          <span className={styles.hud_label}>БАЗА HP:</span>
          <div className={styles.hp_bar_bg}>
            <div
              className={styles.hp_bar_fill}
              style={{ width: `${(cakeHp / maxCakeHp) * 100}%` }}
            />
          </div>
          <span className={styles.hp_text}>{cakeHp}</span>
        </div>
      </div>

      {/* Выпадающий список врагов волны прямо под HUD (открывается только во время волны) */}
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
  );
};
