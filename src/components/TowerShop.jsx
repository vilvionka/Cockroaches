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

  const bonusTowerLimits = useGameStore((state) => state.bonusTowerLimits);





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
            if ((tower.unlockLevel || 1) > currentLevel) return false;
            if (activeTab === 'weapons') return !tower.isAntenna && !tower.isRocketSilo;
            if (activeTab === 'network') return tower.isAntenna === true;
            if (activeTab === 'rockets') return tower.isRocketSilo === true;
            return false;
          })
          .map((tower) => {

            const nextGlobalWave = waveActive ? waveNumber : waveNumber + 1;
            const isLocked = currentLevel === 1 && nextGlobalWave < tower.unlockWave;
            const isSelected = selectedTowerType === tower.type;

            // Расчёт лимита для башен с baseLimit
            const hasLimit = tower.baseLimit !== undefined;
            const bonusLimit = bonusTowerLimits?.[tower.type] || 0;
            const maxAllowed = hasLimit ? tower.baseLimit + (currentLevel - 1) + bonusLimit : Infinity;
            const builtCount = hasLimit ? towers.filter((t) => t.type === tower.type).length : 0;
            const remainingCount = hasLimit ? Math.max(0, maxAllowed - builtCount) : null;
            const isLimitReached = hasLimit && remainingCount <= 0;

            return (
              <button
                key={tower.type}
                onClick={() => selectTowerToBuild(tower.type)}
                disabled={gold < tower.cost || gameOver || isLocked || isLimitReached || (tower.isRocketSilo && hasSilo)}
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
                    {hasLimit && (
                      <span
                        className={styles.limit_badge}
                        data-empty={isLimitReached}
                        title={`Доступно построек: ${remainingCount} из ${maxAllowed}`}
                      >
                        {remainingCount}
                      </span>
                    )}

                    <img
                      src={
                        tower.isAntenna
                          ? `./antenna-${tower.type.replace('an', '')}.png`
                          : tower.isRocketSilo
                            ? './tower_silo.png'
                            : `./tower_${tower.type}.png`
                      }
                      alt={tower.name}
                      className={styles.tower_img}
                    />
                    <div className={styles.tower_info_block}>
                      <span className={styles.tower_name}>{tower.name}</span>
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
