import React, { useEffect, useState } from 'react';
import { preloadAllAssets } from '../utils/assetLoader';
import { initPlayerStorage, loadProgress } from '../utils/storage';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const StartScreen = ({ onStartGame }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initGameAndAssets = async () => {
      // 1. Предзагружаем картинки
      await preloadAllAssets((percent) => {
        if (isMounted) setProgress(percent);
      });

      // 2. Инициализируем Яндекс SDK и профиль игрока
      if (window.YaGames) {
        try {
          const ysdk = await window.YaGames.init();
          window.ysdk = ysdk;
          await initPlayerStorage(ysdk);
          ysdk.features.LoadingAPI?.ready();
        } catch (err) {
          console.warn('YaGames SDK init skipped:', err);
        }
      }

      // 3. Загружаем сохранённый уровень и применяем его в gameStore
      const saved = await loadProgress();
      if (saved.savedLevel > 1) {
        useGameStore.getState().applySavedLevel(saved.savedLevel, saved.savedScore);
      }

      if (isMounted) {
        setIsReady(true);
      }
    };

    initGameAndAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayClick = () => {
    // По требованиям Яндекс Игр сообщаем о старте геймплея
    window.ysdk?.features?.GameplayAPI?.start();
    onStartGame();
  };

  return (
    <div className={styles.start_overlay}>
      {/* Фоновый постер (положите файл poster.jpg в папку public) */}
      <div
        className={styles.start_poster_bg}
        style={{ backgroundImage: "url('./poster.jpg')" }}
      />
      <div className={styles.start_vignette} />

      <div className={styles.start_content}>
        <div className={styles.start_badge}>ТАКТИЧЕСКАЯ ОБОРОНА СЕКТОРА</div>
        <h1 className={styles.start_title}>Звёздный Рой</h1>

        {!isReady ? (
          <div className={styles.loader_box}>
            <div className={styles.loader_text}>
              СИНХРОНИЗАЦИЯ СИСТЕМ... <span>{progress}%</span>
            </div>
            <div className={styles.loader_bar_bg}>
              <div
                className={styles.loader_bar_fill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.start_actions}>
            <button onClick={handlePlayClick} className={styles.start_play_btn}>
              Играть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
