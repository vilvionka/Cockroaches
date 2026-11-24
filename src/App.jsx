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
import { TutorialModal } from './components/TutorialModal';
import { showFullscreenAd } from './utils/yandexAds';
import { UnlockWeaponModal } from './components/UnlockWeaponModal';
import styles from './App.module.css';

const BASE_WIDTH = 1090; // 800 (Canvas) + 290 (Правая панель)
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

  const handleNextLevelClick = () => {
    showFullscreenAd(() => {
      nextLevel();
    });
  };

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

      {/* Масштабируемый игровой контейнер 1090x600 */}
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

        {/* Игровая зона с холстом и верхним HUD поверх него */}
        <div className={styles.canvas_container}>
          <GameCanvas isPaused={!gameStarted || isPortraitMobile} />
          <TopHud />
          <LevelCompleteModal />
          <UnlockWeaponModal />
          <SupplyDropModal />
          <TutorialModal gameStarted={gameStarted} />
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
                        ? (!LEVELS_CONFIG[nextIncomingLevel]
                          ? 'Кампания завершена!'
                          : `Ожидание уровня ${nextIncomingLevel}`)
                        : waveActive
                          ? `Идет волна: ${levelWaveNumber}`
                          : `Следующая волна: ${levelWaveNumber + 1}`}
                    </div>
                  </div>

                  {levelTransition ? (
                    <button onClick={handleNextLevelClick} className={`${styles.bar_btn_weln} ${styles.btn_next_level}`}>
                      {!LEVELS_CONFIG[nextIncomingLevel]
                        ? 'Новая игра'
                        : `Начать уровень ${nextIncomingLevel}`}
                    </button>
                  ) : (
                    <button
                      onClick={startWave}
                      disabled={waveActive}
                      className={`${styles.bar_btn_weln} ${waveActive ? styles.btn_wave_active : styles.btn_wave_ready}`}
                    >
                      {waveActive ? 'Волна идет...' : 'В БОЙ!'}
                    </button>
                  )}
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
