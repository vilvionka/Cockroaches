import React from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const TowerControls = () => {
  const gold = useGameStore((state) => state.gold);
  const gameOver = useGameStore((state) => state.gameOver);
  const towers = useGameStore((state) => state.towers);
  const selectedTowerId = useGameStore((state) => state.selectedTowerId);
  const boostsInventory = useGameStore((state) => state.boostsInventory);

  const activeTower = towers.find(t => t.id === selectedTowerId);

  if (!activeTower) return null;

  const currentLvl = activeTower.level || 1;
  const upgradePrice = Math.round((activeTower.cost * 0.5) * Math.pow(2, currentLvl - 1));
  const sellPrice = Math.round(activeTower.cost * 0.6);
  const canUpgrade = gold >= upgradePrice;

  // Флаги типов
  const isRocket = activeTower.isRocketSilo || activeTower.type === 'silo';
  const isAntenna = activeTower.isAntenna;
  const isStandardGun = !isRocket && !isAntenna;

  // Математика урона ракеты
  let rocketDamage = Math.round(1000 * Math.pow(1.2, currentLvl - 1));
  if (activeTower.specialization === 'nuke') {
    rocketDamage = Math.round(rocketDamage * 1.5);
  } else if (activeTower.specialization === 'grad') {
    rocketDamage = Math.round(1000 * Math.pow(1.2, 3));
  }


  return (
    <div className={styles.upgrade_panel}>
      <div className={styles.bar_gun}>Управление модулем:</div>
      <div className={styles.panel_tower_name}>{activeTower.name}</div>
      <div className={styles.panel_tower_level}>
        Модификация: <span className={styles.cyan_text}>LVL {currentLvl}</span>
      </div>

      {/* 1. Характеристики ракетной шахты */}
      {isRocket && (
        <div className={styles.specs_block}>
          <div className={styles.spec_row}>
            <span>Урон взрыва:</span>
            <span className={styles.gold_text}>{rocketDamage} ед.</span>
          </div>
          <div className={styles.spec_row}>
            <span>Радиус покрытия:</span>
            <span className={styles.cyan_text}>Вся карта 🌍</span>
          </div>
          <div className={styles.spec_row}>
            <span>Статус систем:</span>
            <span className={activeTower.ammoReady > 0 ? styles.cyan_text : styles.gold_text}>
              {activeTower.ammoReady > 0 ? 'ГОТОВ К БОЮ' : 'ЗАРЯДКА...'}
            </span>
          </div>
          {activeTower.ammoReady <= 0 && (
            <div className={styles.spec_row}>
              <span>Перезарядка:</span>
              <span>{Math.ceil(activeTower.chargeTimer / 60)} сек</span>
            </div>
          )}
          <button
            disabled={activeTower.ammoReady <= 0 || activeTower.underConstruction}
            onClick={() => useGameStore.getState().enterRocketAimMode()}
            className={styles.launch_tactical_btn}
          >
            ЗАПУСК СНАРЯДА
          </button>
        </div>
      )}

      {/* 2. Характеристики обычных пушек */}
      {isStandardGun && (
        <div className={styles.specs_block}>
          <div className={styles.spec_row}>
            <span>Урон:</span>
            <span className={styles.gold_text}>
              {activeTower.minDamage !== undefined && activeTower.maxDamage !== undefined
                ? `${activeTower.minDamage} - ${activeTower.maxDamage}`
                : activeTower.damage}
              {activeTower.activeBoosts?.damage > 0 && ' 🔥 x2'}
            </span>
          </div>

          {activeTower.critChance !== undefined && (
            <>
              <div className={styles.spec_row}>
                <span>Шанс крита:</span>
                <span className={styles.cyan_text}>
                  {Math.round(activeTower.critChance * 100)}%
                </span>
              </div>
              <div className={styles.spec_row}>
                <span>Крит. урон:</span>
                <span className={styles.gold_text}>
                  {Math.round(activeTower.critMultiplier * 100)}%
                </span>
              </div>
            </>
          )}

          <div className={styles.spec_row}>
            <span>Дистанция:</span>
            <span className={styles.gold_text}>
              {activeTower.activeBoosts?.range > 0 ? Math.round(activeTower.range * 1.5) : activeTower.range} px
            </span>
          </div>
          {activeTower.activeBoosts?.fireRate > 0 && (
            <div className={styles.spec_row}>
              <span className={styles.cyan_text}>СКОРОСТРЕЛЬНОСТЬ:</span>
              <span className={styles.cyan_text}>УДВОЕНА</span>
            </div>
          )}
        </div>
      )}


      {/* 3. Характеристики антенн */}
      {isAntenna && (
        <div className={styles.specs_block}>
          <div className={styles.spec_row}>
            <span>Радиус сигнала:</span>
            <span className={styles.cyan_text}>{activeTower.range} px</span>
          </div>
          <div className={styles.spec_row}>
            <span>Макс. подключений:</span>
            <span className={styles.gold_text}>{activeTower.maxConnections}</span>
          </div>
        </div>
      )}

      {/* Блок активации бустов (Скрыт для ракет и антенн) */}
      {isStandardGun && (
        <>
          <div className={styles.bar_gun}>Активировать усилитель:</div>
          <div className={styles.boosts_grid}>
            {['damage', 'fireRate', 'range'].map((type) => (
              <button
                key={type}
                disabled={boostsInventory[type] <= 0 || activeTower.activeBoosts?.[type] > 0}
                onClick={() => useGameStore.getState().applyBoostToTower(type)}
                className={styles.boost_btn}
                style={{ border: `1px solid ${type === 'damage' ? '#FF5252' : type === 'fireRate' ? '#FF9800' : '#00e5ff'}` }}
              >
                <span style={{ color: type === 'damage' ? '#FF5252' : type === 'fireRate' ? '#FF9800' : '#00e5ff' }}>
                  {type === 'damage' ? 'УРОН (D)' : type === 'fireRate' ? 'СКОРОСТЬ (F)' : 'РАДИУС (R)'}
                </span>
                <span className={styles.boost_count}>x{boostsInventory[type]}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ВЫБОР СПЕЦИАЛИЗАЦИИ 5 УРОВНЯ */}
      {currentLvl === 4 && !activeTower.underConstruction ? (
        <div className={styles.spec_choice_wrapper}>
          <div className={styles.bar_gun} style={{ color: '#FF9800' }}>
            ВЫБЕРИТЕ СПЕЦИАЛИЗАЦИЮ ({upgradePrice} кр.):
          </div>
          {activeTower.type === 'gun' && (
            <div className={styles.spec_buttons_row}>
              <button onClick={() => useGameStore.getState().specializeTower('ap_ammo')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn}>
                БРОНЕБОЙНЫЕ<br /><small>Пробивают Жуков-Оленей</small>
              </button>
              <button onClick={() => useGameStore.getState().specializeTower('fire_ammo')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn} style={{ borderColor: '#FF5252', color: '#FF5252' }}>
                ЗАЖИГАТЕЛЬНЫЕ<br /><small>+3 DoT урона за 3 сек.</small>
              </button>
            </div>
          )}
          {activeTower.type === 'bomb' && (
            <div className={styles.spec_buttons_row}>
              <button onClick={() => useGameStore.getState().specializeTower('big_splash')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn}>
                АОЕ УРОН<br /><small>Радиус взрыва +60%</small>
              </button>
              <button onClick={() => useGameStore.getState().specializeTower('heavy_target')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn} style={{ borderColor: '#FFD700', color: '#FFD700' }}>
                СИНГЛ ТАРГЕТ<br /><small>Урон по цели x2.2</small>
              </button>
            </div>
          )}
          {activeTower.type === 'frost' && (
            <div className={styles.spec_buttons_row}>
              <button onClick={() => useGameStore.getState().specializeTower('frost_aoe')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn}>
                КРИО-ВЗРЫВ<br /><small>25% Шанс АОЕ заморозки</small>
              </button>
              <button onClick={() => useGameStore.getState().specializeTower('frost_perma')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn} style={{ borderColor: '#00E5FF', color: '#00E5FF' }}>
                ПЕРМАФРОСТ<br /><small>Время контроля +80%</small>
              </button>
            </div>
          )}
          {activeTower.type === 'mlrs' && (
            <div className={styles.spec_buttons_row}>
              <button onClick={() => useGameStore.getState().specializeTower('mlrs_aoe')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn}>
                ШКВАЛ АОЕ<br /><small>Радиус взрыва снарядов +60%</small>
              </button>
              <button onClick={() => useGameStore.getState().specializeTower('mlrs_heavy')} disabled={gold < upgradePrice || gameOver} className={styles.spec_select_btn} style={{ borderColor: '#FFD700', color: '#FFD700' }}>
                ТЯЖЁЛЫЕ БЧ<br /><small>Урон каждого снаряда x2.2</small>
              </button>
            </div>
          )}

          {isRocket && (
            <div className={styles.spec_buttons_row}>
              <button
                onClick={() => useGameStore.getState().specializeTower('nuke')}
                disabled={gold < upgradePrice || gameOver}
                className={styles.spec_select_btn}
                style={{ borderColor: '#FF5252', color: '#FF5252' }}
              >
                ЯДЕРНЫЙ УДАР<br /><small>Урон взрыва +50%</small>
              </button>
              <button
                onClick={() => useGameStore.getState().specializeTower('grad')}
                disabled={gold < upgradePrice || gameOver}
                className={styles.spec_select_btn}
                style={{ borderColor: '#FFD700', color: '#FFD700' }}
              >
                РСЗО «ГРАД»<br /><small>Радиус взрыва +33%</small>
              </button>
            </div>
          )}


        </div>
      ) : (
        <button
          onClick={() => useGameStore.getState().upgradeTower()}
          disabled={!canUpgrade || gameOver || activeTower.underConstruction || currentLvl >= 5}
          className={`${styles.action_btn} ${styles.btn_upgrade}`}
        >
          <span>{activeTower.underConstruction ? 'МОДЕРНИЗАЦИЯ...' : currentLvl >= 5 ? 'МАКС. МОДИФИКАЦИЯ' : 'УЛУЧШИТЬ'}</span>
          <span className={styles.action_price}>{currentLvl >= 5 ? '' : upgradePrice}</span>
        </button>
      )}

      <button onClick={() => useGameStore.getState().sellTower()} disabled={gameOver} className={`${styles.action_btn} ${styles.btn_sell}`}>
        <span>ДЕМОНТИРОВАТЬ</span>
        <span className={styles.action_price}>+{sellPrice}</span>
      </button>
    </div>
  );
};
