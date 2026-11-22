import React, { useState } from 'react';
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
import { showFullscreenAd } from './utils/yandexAds';
import { UnlockWeaponModal } from './components/UnlockWeaponModal';
import styles from './App.module.css';

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

  const handleNextLevelClick = () => {
    showFullscreenAd(() => {
      nextLevel();
    });
  };


  return (
    <div className={styles.wrap}>
      <div className={styles.game}>
        {!gameStarted && (
          <StartScreen onStartGame={() => setGameStarted(true)} />
        )}
        <GameOverModal />
        {/* Игровая зона с холстом и верхним HUD поверх него */}
        <div className={styles.canvas_container}>
          <GameCanvas isPaused={!gameStarted} />
          <TopHud />
          <LevelCompleteModal />
          <UnlockWeaponModal />
          <SupplyDropModal />
          <EmergencyStrikeModal />
        </div>

        {/* Правая панель магазина и апгрейдов */}
        <div className={styles.bar}>
          <h3 className={styles.bar_header}>ЦЕНТР СНАБЖЕНИЯ</h3>

          <GoldPanel />

          {/* Реактивное переключение: если на поле выбрана башня — показываем пульт управления ею, иначе сетку магазина */}
          {selectedTowerId ? <TowerControls /> : <TowerShop />}

          {/* Нижний блок управления волнами (показывается только когда меню конкретной башни закрыто) */}
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
