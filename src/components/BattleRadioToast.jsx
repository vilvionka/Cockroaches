import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, getShiftedLevelData, getMaxTowerLimit } from '../store/gameStore';
import { calculateNetworkGraph } from '../store/gameHelpers';
import { ENEMY_INTEL_TOASTS, TUTORIAL_BATTLE_TIPS } from '../store/storyData';
import { RadioCommBox } from './RadioCommBox';
import styles from '../App.module.css';

export const BattleRadioToast = () => {
  const enemies = useGameStore((state) => state.enemies);
  const spawnQueue = useGameStore((state) => state.spawnQueue);
  const waveActive = useGameStore((state) => state.waveActive);
  const hasBossOnField = enemies.some((e) => e.type === 'boss');
  const currentLevel = useGameStore((state) => state.currentLevel);
  const waveNumber = useGameStore((state) => state.waveNumber);
  const levelWaveNumber = useGameStore((state) => state.levelWaveNumber);
  const boostsInventory = useGameStore((state) => state.boostsInventory);

  const towers = useGameStore((state) => state.towers);
  const towerTypes = useGameStore((state) => state.towerTypes);
  const bonusTowerLimits = useGameStore((state) => state.bonusTowerLimits);
  const selectedTowerType = useGameStore((state) => state.selectedTowerType);
  const buildPreview = useGameStore((state) => state.buildPreview);

  const [toastData, setToastData] = useState(null);
  const [isFlyingToHud, setIsFlyingToHud] = useState(false);

  const announcedWaveRef = useRef(null);
  const lastSlotWarnKeyRef = useRef(null);
  const fullNetWarnKeyRef = useRef(null);
  const seenEnemiesRunRef = useRef(new Set());
  const towerPickTipShownRef = useRef(false);
  const boostTipShownRef = useRef(false);
  const upgradeTipShownRef = useRef(false);
  const prevTotalBoostsRef = useRef(0);
  const timerRef = useRef(null);
  const flyTimerRef = useRef(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (flyTimerRef.current) {
      clearTimeout(flyTimerRef.current);
      flyTimerRef.current = null;
    }
  };

  const showToast = (data, duration = 8500, flyToRadar = false) => {
    clearTimers();
    setIsFlyingToHud(false);
    setToastData(data);

    timerRef.current = setTimeout(() => {
      if (flyToRadar) {
        setIsFlyingToHud(true);
        setTimeout(() => {
          window.dispatchEvent(new Event('radar-intel-received'));
        }, 420);

        flyTimerRef.current = setTimeout(() => {
          setToastData(null);
          setIsFlyingToHud(false);
          flyTimerRef.current = null;
        }, 650);
      } else {
        setToastData(null);
      }
      timerRef.current = null;
    }, duration);
  };

  // Сброс всех одноразовых подсказок при рестарте 1-го уровня или смене уровня
  useEffect(() => {
    if (waveNumber === 0) {
      seenEnemiesRunRef.current.clear();
      announcedWaveRef.current = null;
      lastSlotWarnKeyRef.current = null;
      fullNetWarnKeyRef.current = null;
      towerPickTipShownRef.current = false;
      boostTipShownRef.current = false;
      upgradeTipShownRef.current = false;
      prevTotalBoostsRef.current = 0;
      clearTimers();
      setIsFlyingToHud(false);
      setToastData(null);
    }
  }, [currentLevel, waveNumber]);

  // Подсказка при первом выборе турели в магазине на 1-м уровне (1-й раунд / 1-я волна)
  useEffect(() => {
    if (
      currentLevel !== 1 ||
      waveNumber > 1 ||
      towerPickTipShownRef.current ||
      towers.length > 0
    ) {
      return;
    }

    if (selectedTowerType && selectedTowerType !== 'silo') {
      towerPickTipShownRef.current = true;
      const tip = TUTORIAL_BATTLE_TIPS.firstTowerPick;
      showToast(
        {
          speaker: 'ai',
          badge: tip.badge,
          text: tip.text,
          alertMode: false
        },
        8500,
        false
      );
    }
  }, [currentLevel, waveNumber, selectedTowerType, towers.length]);


  // 1. Подсказка при первом подборе буста с дороги во время боя на 1-м уровне
  useEffect(() => {
    const totalBoosts =
      (boostsInventory?.damage || 0) +
      (boostsInventory?.fireRate || 0) +
      (boostsInventory?.range || 0);

    const prevBoosts = prevTotalBoostsRef.current;
    prevTotalBoostsRef.current = totalBoosts;

    if (
      currentLevel !== 1 ||
      !waveActive ||
      boostTipShownRef.current
    ) {
      return;
    }

    if (totalBoosts > prevBoosts) {
      boostTipShownRef.current = true;
      const tip = TUTORIAL_BATTLE_TIPS.firstBoost;
      showToast(
        {
          speaker: 'ai',
          badge: tip.badge,
          text: tip.text,
          alertMode: false
        },
        8500,
        false
      );
    }
  }, [currentLevel, waveActive, boostsInventory]);


  // 2. Подсказка про прокачку башен в середине 5-й волны 1-го уровня
  useEffect(() => {
    if (
      currentLevel !== 1 ||
      !waveActive ||
      levelWaveNumber !== 5 ||
      upgradeTipShownRef.current
    ) {
      return;
    }

    // На 5-й волне 1-го уровня всего 26 врагов; срабатываем в середине волны (осталось <= 14 в очереди)
    if (spawnQueue.length > 0 && spawnQueue.length <= 14) {
      upgradeTipShownRef.current = true;
      const tip = TUTORIAL_BATTLE_TIPS.upgradeWave5;
      showToast(
        {
          speaker: 'ai',
          badge: tip.badge,
          text: tip.text,
          alertMode: false
        },
        8500,
        false
      );
    }
  }, [currentLevel, waveActive, levelWaveNumber, spawnQueue.length]);

  // 3. Знакомство с жуками на 1-м уровне с перелётом карточки в кнопку «ВРАГИ»
  useEffect(() => {
    if (currentLevel !== 1 || enemies.length === 0) return;

    if (!seenEnemiesRunRef.current.has('wave1_duo')) {
      const hasScoutOrAnt = enemies.some((e) => e.type === 'normal' || e.type === 'ant');
      if (hasScoutOrAnt) {
        seenEnemiesRunRef.current.add('wave1_duo');
        seenEnemiesRunRef.current.add('normal');
        seenEnemiesRunRef.current.add('ant');

        const intel = ENEMY_INTEL_TOASTS.wave1_duo;
        showToast(
          {
            speaker: 'ai',
            badge: intel.badge,
            text: intel.text,
            alertMode: false
          },
          8500,
          true
        );
        return;
      }
    }

    const singleTypes = ['beetle', 'fly', 'rhino'];
    for (const enemyType of singleTypes) {
      if (!seenEnemiesRunRef.current.has(enemyType) && enemies.some((e) => e.type === enemyType)) {
        seenEnemiesRunRef.current.add(enemyType);
        const intel = ENEMY_INTEL_TOASTS[enemyType];
        if (intel) {
          showToast(
            {
              speaker: 'ai',
              badge: intel.badge,
              text: intel.text,
              alertMode: false
            },
            5600,
            true
          );
        }
        break;
      }
    }
  }, [currentLevel, enemies]);

  // 4. Тревога при появлении Королевы Улья (босса)
  useEffect(() => {
    if (!hasBossOnField) return;

    const waveKey = `${currentLevel}_${waveNumber}`;
    if (announcedWaveRef.current === waveKey) return;

    announcedWaveRef.current = waveKey;
    showToast(
      {
        speaker: 'ai',
        badge: 'ТРЕВОГА // БИОСИГНАТУРА БОССА',
        text: 'Внимание, командир! На трассе зафиксирована Королева Улья! Сконцентрируйте огонь всех турелей!',
        alertMode: true
      },
      5500,
      currentLevel === 1
    );
  }, [hasBossOnField, currentLevel, waveNumber]);

  // 5. Умный контроль свободных слотов энергосети
  useEffect(() => {
    const activeType = buildPreview?.type || selectedTowerType;
    if (!activeType || activeType === 'silo') return;

    const towerCfg = towerTypes[activeType];
    if (!towerCfg) return;

    const basePoint = getShiftedLevelData(currentLevel).basePoint;
    const graph = calculateNetworkGraph(towers, basePoint, towerTypes);

    let totalFreeSlots = 0;
    graph.forEach((node) => {
      if (node.isActive && (node.id === 'base' || node.isAntenna)) {
        totalFreeSlots += Math.max(0, node.maxConnections - node.connectedIds.length);
      }
    });

    const combatTypes = ['gun', 'bomb', 'frost', 'mlrs'];
    let remainingCombatLimit = 0;
    combatTypes.forEach((tKey) => {
      const maxLim = getMaxTowerLimit(tKey, currentLevel, bonusTowerLimits);
      const built = towers.filter((t) => t.type === tKey).length;
      remainingCombatLimit += Math.max(0, maxLim - built);
    });

    const antennasCount = towers.filter((t) => t.isAntenna).length;
    const networkStateKey = `${currentLevel}_ant_${antennasCount}`;

    // Ситуация А: Остался ровно 1 последний слот, игрок выбрал боевую башню в магазине (не антенну),
    // и при этом у него ещё остались неиспользованные лимиты на другие башни
    if (
      totalFreeSlots === 1 &&
      !towerCfg.isAntenna &&
      remainingCombatLimit > 1 &&
      lastSlotWarnKeyRef.current !== networkStateKey
    ) {
      lastSlotWarnKeyRef.current = networkStateKey;
      showToast(
        {
          speaker: 'ai',
          badge: 'ПРЕДУПРЕЖДЕНИЕ // ПОСЛЕДНИЙ СЛОТ СЕТИ',
          text: 'Командир, это последний свободный слот связи! Чтобы подключить больше турелей, установите Антенну из вкладки «СВЯЗЬ».',
          alertMode: false
        },
        8500,
        false
      );
      return;
    }


    if (totalFreeSlots === 0 && fullNetWarnKeyRef.current !== networkStateKey) {
      fullNetWarnKeyRef.current = networkStateKey;
      showToast(
        {
          speaker: 'ai',
          badge: 'СЕТЬ ПЕРЕГРУЖЕНА // НЕТ СВОБОДНЫХ СЛОТОВ',
          text: 'Все слоты энергосети заняты (0 свободных)! Демонтируйте одну крайнюю турель и установите на её место Антенну из вкладки «СВЯЗЬ».',
          alertMode: true
        },
        6500,
        false
      );
    }
  }, [selectedTowerType, buildPreview, towers, towerTypes, currentLevel, bonusTowerLimits]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  if (!toastData) return null;

  return (
    <div
      className={`${styles.battle_toast_wrap} ${isFlyingToHud ? styles.battle_toast_fly : ''
        }`}
    >
      <RadioCommBox
        speakerKey={toastData.speaker}
        badge={toastData.badge}
        text={toastData.text}
        alertMode={toastData.alertMode}
      />
    </div>
  );
};
