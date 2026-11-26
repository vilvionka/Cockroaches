import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { useGameStore, LEVELS_CONFIG } from './store/gameStore';
import { TopHud } from './components/TopHud';
import { GoldPanel } from './components/GoldPanel';
import { TowerShop } from './components/TowerShop';
import { TowerControls } from './components/TowerControls';
import { GameOverModal } from './components/GameOverModal';
import { StartScreen } from './components/StartScreen';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { SupplyDropModal } from './components/SupplyDropModal';
import { EmergencyStrikeModal } from './components/EmergencyStrikeModal';
import { IntroStoryModal } from './components/IntroStoryModal';
import { BattleRadioToast } from './components/BattleRadioToast';


import { UnlockWeaponModal } from './components/UnlockWeaponModal';
import styles from './App.module.css';

const BASE_WIDTH = 1210; // 800 (Canvas) + 290 (Правая панель)
const BASE_HEIGHT = 600;

function App() {
  const waveActive = useGameStore((state) => state.waveActive);
  const gameOver = useGameStore((state) => state.gameOver);
  const selectedTowerId = useGameStore((state) => state.selectedTowerId);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const levelWaveNumber = useGameStore((state) => state.levelWaveNumber);
  const levelTransition = useGameStore((state) => state.levelTransition);
  const nextIncomingLevel = useGameStore((state) => state.nextIncomingLevel);

  const startWave = useGameStore((state) => state.startWave);
  const restartGame = useGameStore((state) => state.restartGame);
  const nextLevel = useGameStore((state) => state.nextLevel);

  const [gameStarted, setGameStarted] = useState(false);
  const [scale, setScale] = useState(1);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  const isUserPaused = useGameStore((state) => state.isUserPaused);
  const isStoryPaused = useGameStore((state) => state.isStoryPaused);
  const isSupplyDropOpen = useGameStore((state) => state.isSupplyDropOpen);
  const isEmergencyAdOpen = useGameStore((state) => state.isEmergencyAdOpen);
  const unlockedWeaponModal = useGameStore((state) => state.unlockedWeaponModal);
  const togglePause = useGameStore((state) => state.togglePause);

  const isSidebarBlocked =
    isUserPaused ||
    isStoryPaused ||
    levelTransition ||
    isSupplyDropOpen ||
    isEmergencyAdOpen ||
    Boolean(unlockedWeaponModal);

  // Расчёт масштаба и отслеживание поворота экрана
  useEffect(() => {
    const updateViewport = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Определяем узкий портретный экран (смартфон в вертикальном положении)
      const portrait = vh > vw && vw < 768;
      setIsPortraitMobile(portrait);

      const scaleX = vw / BASE_WIDTH;
      const scaleY = vh / BASE_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  // Автопауза при сворачивании вкладки или потере фокуса (требование Яндекс Игр)
  useEffect(() => {
    if (!gameStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        useGameStore.getState().pauseBySystem();
      }
    };

    const handleWindowBlur = () => {
      useGameStore.getState().pauseBySystem();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [gameStarted]);

  useEffect(() => {
    const preventZoom = (e) => e.preventDefault();
    document.addEventListener('gesturestart', preventZoom);
    return () => document.removeEventListener('gesturestart', preventZoom);
  }, []);





  return (
    <div
      className={styles.wrap}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Плашка просьбы повернуть телефон горизонтально (для вертикальных смартфонов) */}
      {isPortraitMobile && (
        <div className={styles.rotate_overlay}>
          <div className={styles.rotate_card}>
            <div className={styles.rotate_icon}>📱↻</div>
            <div className={styles.lvl_complete_badge}>ОПТИМАЛЬНЫЙ РЕЖИМ ОБЗОРА</div>
            <h2 className={styles.rotate_title}>ПОВЕРНИТЕ УСТРОЙСТВО</h2>
            <p className={styles.rotate_desc}>
              Для тактического управления обороной переверните смартфон в горизонтальное положение
            </p>
          </div>
        </div>
      )}

      {/* Масштабируемый игровой контейнер 1210x600 */}
      <div
        className={styles.game}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {!gameStarted && (
          <StartScreen onStartGame={() => setGameStarted(true)} />
        )}
        <GameOverModal />

        {/* Общий затемняющий оверлей поверх холста и правого сайт-бара */}
        {gameStarted && !gameOver && isSidebarBlocked && (
          <div className={styles.global_modal_backdrop} />
        )}


        {/* Игровая зона с холстом и верхним HUD поверх него */}
        <div className={styles.canvas_container}>
          <GameCanvas isPaused={!gameStarted || isPortraitMobile} />
          <TopHud />
          <BattleRadioToast />
          <LevelCompleteModal />
          <UnlockWeaponModal />
          <SupplyDropModal />
          <IntroStoryModal gameStarted={gameStarted} />
          <EmergencyStrikeModal />
        </div>

        {/* Правая панель магазина и апгрейдов (ширина 290px) */}
        <div className={styles.bar}>
          <h3 className={styles.bar_header}>ЦЕНТР СНАБЖЕНИЯ</h3>

          <GoldPanel />

          {selectedTowerId ? <TowerControls /> : <TowerShop />}

          {!selectedTowerId && (
            <div className={styles.bar_info_btn}>
              {gameOver ? (
                <button onClick={restartGame} className={styles.bar_btn_restart}>Заново</button>
              ) : (
                <div className={styles.level_status_block}>
                  <div className={styles.bar_info_level}>
                    <h2 className={styles.level_title}>УРОВЕНЬ {currentLevel}</h2>
                    <div className={styles.wave_subtitle}>
                      {levelTransition
                        ? 'Сектор зачищен'
                        : waveActive
                          ? `Идет волна: ${levelWaveNumber}`
                          : `Следующая волна: ${levelWaveNumber + 1}`}
                    </div>
                  </div>

                  <button
                    onClick={startWave}
                    disabled={waveActive || levelTransition}
                    className={`${styles.bar_btn_weln} ${waveActive || levelTransition ? styles.btn_wave_active : styles.btn_wave_ready
                      }`}
                  >
                    {levelTransition
                      ? 'Ожидание...'
                      : waveActive
                        ? 'Волна идет...'
                        : 'В БОЙ!'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
