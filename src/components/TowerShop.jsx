import React from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const TowerShop = () => {
  const gold = useGameStore((state) => state.gold);
  const gameOver = useGameStore((state) => state.gameOver);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const waveActive = useGameStore((state) => state.waveActive);
  const waveNumber = useGameStore((state) => state.waveNumber);
  const selectedTowerType = useGameStore((state) => state.selectedTowerType);
  const activeTab = useGameStore((state) => state.activeTab);
  const towerTypes = useGameStore((state) => state.towerTypes);

  const selectTowerToBuild = useGameStore((state) => state.selectTowerToBuild);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const towers = useGameStore((state) => state.towers);
  const hasSilo = towers.some((t) => t.isRocketSilo);

  return (
    <>
      {/* ТАБЫ МАГАЗИНА */}
      <div className={styles.tabs_container}>
        {['weapons', 'network', 'rockets'].map((tab) => (
          <button
            key={tab}
            className={styles.tab_btn}
            data-active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'weapons' ? 'ОРУЖИЕ' : tab === 'network' ? 'СВЯЗЬ' : 'РАКЕТЫ'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '10px' }}></div>

      <div className={styles.bar_gun}>
        {activeTab === 'weapons' ? 'Доступное вооружение:' : activeTab === 'network' ? 'Модули связи:' : 'Супероружие:'}
      </div>

      {/* СЕТКА ТОВАРОВ */}
      <div className={styles.bar_grid}>
        {Object.values(towerTypes)
          .filter((tower) => {
            if (activeTab === 'weapons') return !tower.isAntenna && !tower.isRocketSilo;
            if (activeTab === 'network') return tower.isAntenna === true;
            if (activeTab === 'rockets') return tower.isRocketSilo === true;
            return false;
          })
          .map((tower) => {
            const nextGlobalWave = waveActive ? waveNumber : waveNumber + 1;
            const isLocked = currentLevel === 1 && nextGlobalWave < tower.unlockWave;
            const isSelected = selectedTowerType === tower.type;

            return (
              <button
                key={tower.type}
                onClick={() => selectTowerToBuild(tower.type)}
                disabled={gold < tower.cost || gameOver || isLocked || (tower.isRocketSilo && hasSilo)}
                className={styles.bar_button}
                data-selected={isSelected}
                data-locked={isLocked}
              >
                {isLocked ? (
                  <div className={styles.lock_layer}>
                    <span className={styles.lock_icon}>🔒</span>
                    <span className={styles.lock_text}>W{tower.unlockWave}</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={
                        tower.isAntenna
                          ? `./antenna-${tower.type.replace('an', '')}.png` // Сконструирует /antenna-3.png, /antenna-4.png и т.д.
                          : tower.isRocketSilo
                            ? './tower_silo.png'
                            : `./tower_${tower.type}.png`
                      }

                      alt={tower.name}
                      className={styles.tower_img}
                    />
                    <div className={styles.tower_info_block}>
                      <span className={tower.name}>{tower.name}</span>
                      <span className={styles.bar_price}>{tower.cost}</span>
                    </div>
                  </>
                )}
              </button>
            );
          })}
      </div>

      {selectedTowerType && (
        <div className={styles.bar_info}>
          {selectedTowerType === 'silo'
            ? 'ℹ️ Подтвердите установку (✓) на подсвеченной стройплощадке!'
            : 'ℹ️ Кликните рядом с дорогой, но не в плотную к соседней башне, чтобы установить пушку или антенну!'}
        </div>
      )}

    </>
  );
};
