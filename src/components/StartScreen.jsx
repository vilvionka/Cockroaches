import React, { useEffect, useState } from 'react';
import { preloadAllAssets } from '../utils/assetLoader';
import { initPlayerStorage, loadProgress } from '../utils/storage';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const StartScreen = ({ onStartGame }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedLevelNum, setSavedLevelNum] = useState(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        if (isMounted) {
          setHasSavedProgress(true);
          setSavedLevelNum(saved.savedLevel);
        }
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
    window.ysdk?.features?.GameplayAPI?.start();
    onStartGame();
  };

  const handleConfirmNewGame = async () => {
    if (isResetting) return;
    setIsResetting(true);
    await useGameStore.getState().resetAllProgress();
    setIsResetting(false);
    setShowResetConfirm(false);
    window.ysdk?.features?.GameplayAPI?.start();
    onStartGame();
  };

  return (
    <div className={styles.start_overlay}>
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
          <div className={styles.start_actions_col}>
            <button onClick={handlePlayClick} className={styles.start_play_btn}>
              {hasSavedProgress ? `Продолжить (Ур. ${savedLevelNum})` : 'Играть'}
            </button>

            {hasSavedProgress && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className={styles.start_new_game_btn}
              >
                Новая игра
              </button>
            )}
          </div>
        )}
      </div>

      {/* Окно подтверждения сброса прогресса */}
      {showResetConfirm && (
        <div className={styles.start_confirm_overlay}>
          <div className={styles.start_confirm_card}>
            <div className={styles.emergency_badge}>ВНИМАНИЕ // ОЧИСТКА ДАННЫХ</div>
            <h2 className={styles.pause_title} style={{ fontSize: '18px', marginBottom: '8px' }}>
              НАЧАТЬ НОВУЮ ИГРУ?
            </h2>
            <p className={styles.emergency_desc}>
              Текущий прогресс уровней будет сброшен, а кампания начнётся с 1-го сектора.
            </p>
            <div className={styles.confirm_btn_row}>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmNewGame}
                className={styles.confirm_yes_btn}
              >
                {isResetting ? 'СБРОС...' : 'ДА, СБРОСИТЬ'}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirm(false)}
                className={styles.confirm_no_btn}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
