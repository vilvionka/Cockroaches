// --- 1. ТАЙМЕР ВОЛНЫ И СПАВН (ИСПРАВЛЕННЫЙ) ---
import { useGameStore, LEVELS_CONFIG } from './gameStore';

export const handleSpawning = (state) => {
  let { spawnQueue, spawnTimer, waveTimer, waveActive, enemies } = state;
  let newEnemies = [...enemies];
  let newQueue = [...spawnQueue];
  let shouldStartWave = false;

  // Если волна не активна и идет отсчет
  if (!waveActive && waveTimer > 0) {
    waveTimer--;
    if (waveTimer === 0) {
      shouldStartWave = true; // Сигнализируем, что пора запускать волну
    }
  }

  // Если волна идет и в очереди есть враги
  if (waveActive && newQueue.length > 0) {
    spawnTimer++;
    if (spawnTimer >= newQueue[0].delay) {
      spawnTimer = 0;
      newEnemies.push(newQueue.shift());
    }
  }

  return { waveTimer, spawnTimer, spawnQueue: newQueue, enemies: newEnemies, shouldStartWave };
};



// --- 2. ДВИЖЕНИЕ ЖУКОВ И ОПТИМИЗИРОВАННЫЙ СЛЕД ОТ ЛАПОК (ПО ДИСТАНЦИИ) ---
export const updateEnemiesMovement = (enemies, roadPaths, currentCakeHp) => {
  let cakeHp = currentCakeHp;
  let gameOver = false;

  // Массив для новых точек шагов в этом кадре
  let spawnedTrailsInThisFrame = [];

  const updatedEnemies = enemies.map((enemy) => {
    const currentPath = roadPaths[enemy.assignedPathIndex || 0];
    if (!currentPath) return null;

    const targetIndex = enemy.currentPointIndex + 1;
    const isLastPoint = targetIndex >= currentPath.length;
    const target = currentPath[targetIndex];

    // Внутри updateEnemiesMovement в gameHelpers.js:
    if (isLastPoint || (targetIndex === currentPath.length - 1 && enemy.x >= target.x - 70)) {
      cakeHp -= enemy.damage;
      if (cakeHp <= 0) { cakeHp = 0; gameOver = true; }

      const currentState = useGameStore.getState();
      currentState.shieldFlashTimer = 30;

      return null; // Жук «зашел внутрь» базы и удаляется из игры
    }


    let newX = enemy.x;
    let newY = enemy.y;
    let currentHp = enemy.hp;

    // Обсчет тактов горения
    let burnTimers = enemy.burnTimers ? [...enemy.burnTimers] : [];
    burnTimers = burnTimers.map(burn => {
      let timeLeft = burn.timeLeft - 1;
      let nextTick = burn.nextTick - 1;
      if (nextTick <= 0) {
        currentHp -= 1;
        nextTick = 30;
      }
      return { timeLeft, nextTick };
    }).filter(burn => burn.timeLeft > 0);

    // Расчет скорости
    let currentSpeed = enemy.speed;
    let nextSlowTimer = enemy.slowTimer || 0;

    if (nextSlowTimer > 0) {
      currentSpeed = enemy.speed * (enemy.slowFactor || 0.5);
      nextSlowTimer--;
    }

    // Запоминаем старые координаты перед шагом для расчета пройденного пути
    const oldX = newX;
    const oldY = newY;

    if (newX < target.x) newX = Math.min(newX + currentSpeed, target.x);
    if (newX > target.x) newX = Math.max(newX - currentSpeed, target.x);
    if (newY < target.y) newY = Math.min(newY + currentSpeed, target.y);
    if (newY > target.y) newY = Math.max(newY - currentSpeed, target.y);

    let nextIndex = enemy.currentPointIndex;
    if (newX === target.x && newY === target.y) nextIndex += 1;

    let currentAnimSpeed = enemy.animSpeed;
    if (nextSlowTimer > 0) {
      currentAnimSpeed = enemy.animSpeed * 2;
    }

    let nextTick = enemy.tickCounter + 1;
    let nextFrame = enemy.currentFrame;
    if (nextTick >= currentAnimSpeed) {
      nextTick = 0;
      nextFrame = (nextFrame + 1) % enemy.totalFrames;
    }

    // 🎯 СУПЕРОПТИМИЗАЦИЯ: След лапки ставится СТРОГО по пройденному расстоянию
    const movedDistance = Math.sqrt((newX - oldX) ** 2 + (newY - oldY) ** 2);
    let currentDistanceAccumulator = (enemy.distanceAccumulator || 0) + movedDistance;

    // Жук делает "шаг" лапкой каждые 18 пикселей пройденного пути
    if (currentDistanceAccumulator >= 18) {
      currentDistanceAccumulator = 0; // Сбрасываем счетчик расстояния

      // Маленькая аккуратная точка (размер 2 пикселя для обычных, 4 для босса)
      const dotSize = enemy.type === 'boss' ? 4 : 2;

      spawnedTrailsInThisFrame.push({
        id: Math.random() + Date.now(),
        x: newX,
        y: newY,
        size: dotSize,
        color: enemy.bloodColor || '#39ff14',
        timer: 180,    // Исчезает быстрее — всего за 3 секунды (180 кадров)
        maxTimer: 180
      });
    }

    return {
      ...enemy,
      x: newX,
      y: newY,
      hp: currentHp,
      burnTimers,
      currentPointIndex: nextIndex,
      currentFrame: nextFrame,
      tickCounter: nextTick,
      slowTimer: nextSlowTimer,
      distanceAccumulator: currentDistanceAccumulator // Сохраняем накопленный путь
    };
  }).filter(enemy => enemy !== null);

  return { enemies: updatedEnemies, cakeHp, gameOver, spawnedTrailsInThisFrame };
};




/// --- ОБНОВЛЕННАЯ РАБОТА БАШЕН С ФИКСАЦИЕЙ ЦЕЛИ (ИСПРАВЛЕННЫЙ ВЫВОД ЧАСТИЦ) ---
export const updateTowersAndShooting = (towers, enemies, bullets, currentParticles = []) => {
  let newBullets = [...bullets];
  let newParticles = [...currentParticles]; // Инициализируем массив, чтобы не было ошибки ReferenceError

  const state = useGameStore.getState();

  const updatedTowers = towers.map((tower) => {

    if (tower.isAntenna || tower.isRocketSilo || tower.underConstruction) {
      return tower;
    }
    // 1. Рассчитываем модификаторы от активных бустов
    let boostDamageMul = 1;
    let boostFireRateMul = 1;
    let boostRangeMul = 1;

    if (tower.activeBoosts) {
      if (tower.activeBoosts.damage > 0) boostDamageMul = 2.0;       // Урон x2
      if (tower.activeBoosts.fireRate > 0) boostFireRateMul = 2.0;   // Скорострельность x2
      if (tower.activeBoosts.range > 0) boostRangeMul = 1.5;         // Дальность x1.5
    }

    let currentCooldown = tower.cooldown > 0 ? tower.cooldown - 1 : 0;

    // Плавный возврат ствола от отдачи
    let currentRecoil = tower.recoilOffset || 0;
    if (currentRecoil > 0) {
      currentRecoil -= 0.6;
      if (currentRecoil < 0) currentRecoil = 0;
    }

    // Текущий рабочий радиус с учетом бустов
    const currentMaxRange = tower.range * boostRangeMul;

    let targetEnemy = null;

    // 2. МЕХАНИКА ФИКСАЦИИ ЦЕЛИ (TARGET LOCKING)
    if (tower.targetEnemyId) {
      // Проверяем, жив ли еще зафиксированный жук
      const lockedEnemy = enemies.find(e => e.id === tower.targetEnemyId);

      if (lockedEnemy) {

        if (tower.type === 'gun' && tower.specialization !== 'ap_ammo' && lockedEnemy.type === 'rhino') targetEnemy = null;
        // Проверяем, находится ли он все еще в радиусе действия башни
        const dx = lockedEnemy.x - tower.x;
        const dy = lockedEnemy.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= currentMaxRange) {
          targetEnemy = lockedEnemy; // Цель валидна, продолжаем её вести!
        }
      }
    }

    // 3. ЕСЛИ СТАРОЙ ЦЕЛИ НЕТ (УБИТА/ВЫШЛА), ИЩЕМ НОВУЮ БЛИЖАЙШУЮ
    if (!targetEnemy) {
      let closestDist = currentMaxRange;

      enemies.forEach((enemy) => {

        if (tower.type === 'gun' && tower.specialization !== 'ap_ammo' && enemy.type === 'rhino') {
          return; // Просто пропускаем этого жука, пулемет его не видит
        }

        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
          closestDist = dist;
          targetEnemy = enemy;
        }
      });
    }

    let towerAngle = tower.angle;
    let nextTargetId = targetEnemy ? targetEnemy.id : null; // Запоминаем ID для следующего кадра

    if (targetEnemy) {
      // Идеальный угол на цель
      const targetAngle = Math.atan2(targetEnemy.y - tower.y, targetEnemy.x - tower.x);

      // Рассчитываем разницу углов
      let angleDiff = targetAngle - towerAngle;

      // Нормализуем разницу углов (-PI до +PI)
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      // Скорость вращения
      const rSpeed = tower.rotationSpeed || 0.1;

      // Поворачиваем башню
      if (Math.abs(angleDiff) <= rSpeed) {
        towerAngle = targetAngle;
      } else {
        towerAngle += Math.sign(angleDiff) * rSpeed;
      }

      // Снова нормализуем текущий угол
      while (towerAngle < -Math.PI) towerAngle += Math.PI * 2;
      while (towerAngle > Math.PI) towerAngle -= Math.PI * 2;

      // Проверяем финальную погрешность для выстрела
      let finalDiff = targetAngle - towerAngle;
      while (finalDiff < -Math.PI) finalDiff += Math.PI * 2;
      while (finalDiff > Math.PI) finalDiff -= Math.PI * 2;

      // Внутри момента выстрела:
      if (currentCooldown === 0 && Math.abs(finalDiff) < 0.2) {
        currentCooldown = Math.round(tower.fireRate / boostFireRateMul);
        currentRecoil = tower.type === 'bomb' ? 5 : tower.type === 'frost' ? 2.5 : 3;

        // А. ЭФФЕКТ ВСПЫШКИ ИЗ ДУЛА (Тепер пишем в локальный массив функции)
        newParticles.push({
          id: Math.random(),
          type: 'flash',
          x: tower.x + Math.cos(tower.angle) * 25,
          y: tower.y + Math.sin(tower.angle) * 25,
          bulletType: tower.bulletType,
          timer: 30,
          maxTimer: 30,
          size: tower.type === 'bomb' ? 15 : 10
        });

        // Б. ЭФФЕКТ ВЫЛЕТАЮЩИХ ГИЛЬЗ (РЕАЛИСТИЧНЫЙ КУВЫРОК И ОТСКОК)
        if (tower.type !== 'frost') {
          // Выбрасываем гильзу вправо от направления ствола (на ~90 градусов / PI/2) и чуть назад
          const ejectionAngle = towerAngle + Math.PI / 2 + (Math.random() * 0.4 - 0.2);

          // Задаем начальный случайный импульс полета вбок
          const speed = 1.0 + Math.random() * 1.0;

          newParticles.push({
            id: Math.random(),
            type: 'shell',
            x: tower.x,
            y: tower.y,
            vx: Math.cos(ejectionAngle) * speed,
            vy: Math.sin(ejectionAngle) * speed - 2.5, // Сильный начальный импульс ВВЕРХ подскока
            timer: 25,     // Увеличим время жизни, чтобы они успевали красиво упасть
            maxTimer: 25,
            angle: Math.random() * Math.PI * 2, // Начальный случайный угол поворота самой гильзы
            rotSpeed: 0.15 + Math.random() * 0.2 // Скорость кувырка в воздухе
          });
        }

        let rawDamage = tower.damage;
        if (tower.minDamage !== undefined && tower.maxDamage !== undefined) {
          rawDamage = Math.floor(Math.random() * (tower.maxDamage - tower.minDamage + 1)) + tower.minDamage;
        }

        // Проверка критического удара (только для пушек, у которых задан critChance)
        let isCrit = false;
        if (tower.critChance && Math.random() < tower.critChance) {
          isCrit = true;
          rawDamage = Math.round(rawDamage * (tower.critMultiplier || 1.5));
        }

        const finalDamage = Math.round(rawDamage * boostDamageMul);


        newBullets.push({
          id: Math.random(),
          x: tower.x,
          y: tower.y,
          targetId: targetEnemy.id,
          speed: 8,
          damage: finalDamage,
          isCrit: isCrit, // Передаем флаг крита в пулю
          bulletType: tower.bulletType,
          specialization: tower.specialization,
          splashRadius: tower.splashRadius || 0,
          splashDamage: isCrit ? Math.round((tower.splashDamage || 0) * (tower.critMultiplier || 1.5)) : (tower.splashDamage || 0),
          slowDuration: tower.slowDuration || 0,
          slowFactor: tower.slowFactor || 0
        });
      }
    }

    return {
      ...tower,
      cooldown: currentCooldown,
      angle: towerAngle,
      recoilOffset: currentRecoil,
      targetEnemyId: nextTargetId
    };
  });

  // Возвращаем из функции три обновленных массива
  return { towers: updatedTowers, bullets: newBullets, particles: newParticles };
};







// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ СТОЛКНОВЕНИЙ И ЧАСТИЦ КРОВИ (БЕЗ МУТАЦИИ МАССИВА) ---
export const updateBulletsAndCollisions = (
  bullets,
  enemies,
  explosions,
  currentGold,
  roadPaths,
  currentDamageTexts = [],
  currentLevel = 1,
  existingDroppedItems = [] // 👈 Принимаем предметы седьмым аргументом
) => {
  const state = useGameStore.getState();

  let newExplosions = [...explosions];
  let newGold = currentGold;
  let newDamageTexts = [...currentDamageTexts];
  let newlyDroppedItems = [];

  // Подсчитываем, сколько бустов (НЕ золота) УЖЕ выпало в этой волне и лежит на земле
  const currentBoostsCount = existingDroppedItems.filter(i => i.boostType !== 'gold').length;

  const updatedBullets = bullets.map((bullet) => {
    const target = enemies.find(e => e.id === bullet.targetId);
    if (!target) return null;

    const dx = target.x - bullet.x;
    const dy = target.y - bullet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {

      // --- 1. ПРОВЕРКА УКЛОНЕНИЯ (MISS) ---
      const canDodge = bullet.bulletType === 'frost' ? !target.ignoreFrostMiss : true;
      if (canDodge && target.missChance && Math.random() < target.missChance) {
        newDamageTexts.push({
          id: Math.random(),
          x: target.x + (Math.random() * 16 - 8),
          y: target.y - 18,
          text: 'MISS',
          color: '#B0BEC5', // Стильный серебристо-серый цвет уклонения
          isMiss: true,
          alpha: 1,
          timer: 38
        });

        return null; // Пуля пролетела мимо, урон и эффекты не применяются
      }


      target.hp -= bullet.damage;

      // 👈 1. ЭФФЕКТ ЗАЖИГАТЕЛЬНЫХ ПАТРОНОВ (DoT урон)
      if (bullet.specialization === 'fire_ammo') {
        if (!target.burnTimers) target.burnTimers = [];
        // Добавляем таймер горения: 180 кадров (3 секунды), будет тикать каждые 30 кадров
        target.burnTimers.push({ timeLeft: 180, nextTick: 30 });
      }

      // 👈 2. ЭФФЕКТ КРИО-ВЗРЫВА (25% шанс заморозки по площади)
      if (bullet.specialization === 'frost_aoe' && Math.random() < 0.25) {
        const frostRadius = 70;
        enemies.forEach((otherEnemy) => {
          const fDx = otherEnemy.x - target.x;
          const fDy = otherEnemy.y - target.y;
          if (Math.sqrt(fDx * fDx + fDy * fDy) <= frostRadius) {
            otherEnemy.slowTimer = bullet.slowDuration;
            otherEnemy.slowFactor = bullet.slowFactor;
          }
        });
        // Добавим синюю вспышку взрыва на холст
        newExplosions.push({
          id: Math.random(), x: target.x, y: target.y, type: 'bomb_blast', angle: 0, currentFrame: 0, tickCounter: 0, cols: 4, rows: 2, totalFrames: 8, animSpeed: 4, size: frostRadius * 1
        });
      }

      // ИСПРАВЛЕНИЕ: Кровь пушится напрямую в глобальный стейт частиц, 
      // убран конфликт и мутация локального массива newlyDroppedItems
      if (!state.particles) state.particles = [];
      const enemyBlood = target.bloodColor || '#39ff14';
      const angleOfImpact = Math.atan2(target.y - bullet.y, target.x - bullet.x);

      const critMul = bullet.isCrit ? 2 : 1; // Множитель сочности для крита

      if (bullet.bulletType === 'splash') {
        // --- СОЧНЫЙ РАДИАЛЬНЫЙ ВЗРЫВ КРОВИ ОТ БОМБАРДЫ (16 капель, при крите — 32) ---
        const splashDrops = 16 * critMul;
        for (let i = 0; i < splashDrops; i++) {
          const bloodAngle = (i * (Math.PI * 2) / splashDrops) + (Math.random() * 0.3 - 0.15);
          // При крите кровь летит дальше (скорость выше)
          const bSpeed = (1.1 + Math.random() * 1.2) * (bullet.isCrit ? 1.55 : 1);

          state.particles.push({
            id: Math.random(),
            type: 'blood',
            x: target.x,
            y: target.y,
            vx: Math.cos(bloodAngle) * bSpeed,
            vy: Math.sin(bloodAngle) * bSpeed,
            color: enemyBlood,
            size: (3 + Math.random() * 3) * (bullet.isCrit ? 1.35 : 1),
            timer: (12 + Math.floor(Math.random() * 8)) * (bullet.isCrit ? 1.3 : 1),
            maxTimer: bullet.isCrit ? 26 : 20
          });
        }
      } else {
        // --- НАПРАВЛЕННЫЕ БРЫЗГИ ПУЛЕМЕТА (4 капли, при крите — 8) ---
        const baseDrops = bullet.bulletType === 'frost' ? 2 : 4;
        const dropCount = baseDrops * critMul;
        for (let i = 0; i < dropCount; i++) {
          // При крите чуть шире конус разлета брызг
          const spread = bullet.isCrit ? 0.9 : 0.6;
          const bloodAngle = angleOfImpact + (Math.random() * spread - spread / 2);
          // При крите кровь летит значительно дальше
          const bSpeed = (1.2 + Math.random() * 1.1) * (bullet.isCrit ? 1.7 : 1);

          state.particles.push({
            id: Math.random(),
            type: 'blood',
            x: target.x,
            y: target.y,
            vx: Math.cos(bloodAngle) * bSpeed,
            vy: Math.sin(bloodAngle) * bSpeed,
            color: bullet.bulletType === 'frost' ? '#00E5FF' : enemyBlood,
            size: (1.2 + Math.random() * 1.2) * (bullet.isCrit ? 1.5 : 1),
            timer: (10 + Math.floor(Math.random() * 6)) * (bullet.isCrit ? 1.35 : 1),
            maxTimer: bullet.isCrit ? 22 : 16
          });
        }
      }

      const isFrost = bullet.bulletType === 'frost';
      newDamageTexts.push({
        id: Math.random(),
        x: target.x + (Math.random() * 16 - 8),
        y: target.y - (bullet.isCrit ? 22 : 15),
        text: bullet.isCrit ? `-${bullet.damage}` : `-${bullet.damage}`,
        color: isFrost ? '#00E5FF' : bullet.isCrit ? '#FF3D00' : '#FFEB3B',
        isCrit: bullet.isCrit, // Передаем флаг для размера шрифта
        alpha: 1,
        timer: bullet.isCrit ? 48 : 35
      });


      if (bullet.bulletType === 'frost') {
        target.slowTimer = bullet.slowDuration;
        target.slowFactor = bullet.slowFactor;
      }

      if (bullet.bulletType === 'splash') {
        enemies.forEach((otherEnemy) => {
          if (otherEnemy.id !== target.id) {
            const sDx = otherEnemy.x - target.x;
            const sDy = otherEnemy.y - target.y;
            if (Math.sqrt(sDx * sDx + sDy * sDy) <= bullet.splashRadius) {
              // Учитываем сопротивление сплэшу (для fly -50%)
              const resistMul = otherEnemy.splashResist ? (1 - otherEnemy.splashResist) : 1;
              const actualSplashDamage = Math.round(bullet.splashDamage * resistMul);

              otherEnemy.hp -= actualSplashDamage;

              newDamageTexts.push({
                id: Math.random(),
                x: otherEnemy.x + (Math.random() * 16 - 8),
                y: otherEnemy.y - 15,
                text: `-${actualSplashDamage}`,
                color: '#FF9800',
                alpha: 1,
                timer: 35
              });
            }
          }
        });

        newExplosions.push({
          id: Math.random(),
          x: target.x,
          y: target.y,
          type: 'bomb_blast',
          angle: 0, currentFrame: 0, tickCounter: 0, cols: 4, rows: 2, totalFrames: 8, animSpeed: 4, size: bullet.splashRadius * 1.3
        });
      }

      // Внутри updateBulletsAndCollisions в gameHelpers.js:
      enemies.forEach((enemy) => {
        if (enemy.hp <= 0 && !enemy.rewardGiven) {
          enemy.rewardGiven = true;
          newGold += enemy.reward;

          // 🔥 ЕСЛИ УМЕР БОСС-МАТКА -> СПАВНИМ 2 ОБЫЧНЫХ ЖУКА
          if (enemy.type === 'boss' && enemy.bossSpeciesSource) {
            const childType = enemy.bossSpeciesSource;
            const baseChildTemplate = state.enemyTypes[childType];

            // Находим конфиг уровня БЕЗОПАСНО, так как теперь LEVELS_CONFIG импортирован сверху
            const currentLvlConfig = LEVELS_CONFIG[currentLevel || 1];
            const levelGrowthRate = 0.12 + ((currentLevel || 1) - 1) * 0.04;
            const difficultyMultiplier = 1 + (state.waveNumber - 1) * levelGrowthRate;
            const childHp = Math.round(baseChildTemplate.hp * difficultyMultiplier);

            // Создаем 2 новых жука
            for (let k = 0; k < 2; k++) {
              const offsetX = (Math.random() * 30 - 15);
              const offsetY = (Math.random() * 30 - 15);

              enemies.push({
                ...baseChildTemplate,
                id: Math.random() + Date.now() + k,
                x: enemy.x + offsetX,
                y: enemy.y + offsetY,
                hp: childHp,
                maxHp: childHp,
                reward: Math.round(baseChildTemplate.reward + (state.waveNumber * 1.5)),
                assignedPathIndex: enemy.assignedPathIndex,
                currentPointIndex: enemy.currentPointIndex,
                currentFrame: 0,
                tickCounter: 0,
                speed: baseChildTemplate.speed * 1.2
              });
            }

            // Красивая надпись
            newDamageTexts.push({
              id: Math.random(),
              x: enemy.x,
              y: enemy.y - 35,
              text: "МАТКА УНИЧТОЖЕНА: ПРОРЫВ СЛЕДУЮЩЕГО ПОКОЛЕНИЯ! 🪳🪳",
              color: '#FF5252',
              alpha: 1,
              timer: 70
            });
          }

          // 💰 РЕАНИМАЦИЯ И ПОЛНОЕ ВОССТАНОВЛЕНИЕ ВЫПАДЕНИЯ БОНУСОВ И МОНЕТ
          const waveDensity = enemies.length;
          const dynamicDropChance = Math.max(0.05, 0.25 - (waveDensity * 0.007));

          if (Math.random() < dynamicDropChance) {
            const rand = Math.random();
            let boostType = 'gold';
            let value = 50;

            if (rand < 0.65) {
              boostType = 'gold';
              value = currentLevel === 1 ? 50 : currentLevel === 2 ? 100 : 150;
            } else {
              // currentBoostsCount теперь считается верно на основе проброшенного седьмого аргумента!
              if (currentBoostsCount < 3) {
                const boostRand = Math.random();
                if (boostRand < 0.34) boostType = 'damage';
                else if (boostRand < 0.67) boostType = 'fireRate';
                else boostType = 'range';
              } else {
                boostType = 'gold';
                value = 40;
              }
            }

            if ((enemy.type === 'beetle' || enemy.type === 'rhino') && boostType === 'gold') {
              value += 50;
            }

            // Добавляем созданный буст в возвращаемый массив!
            newlyDroppedItems.push({
              id: Math.random(),
              x: enemy.x,
              y: enemy.y,
              boostType,
              value,
              timer: 300
            });
          }

          // Рассчитываем угол смерти жука для генерации брызг/анимаций взрыва
          const currentPath = roadPaths[enemy.assignedPathIndex || 0];
          const targetIndex = enemy.currentPointIndex + 1;
          let deathAngle = 0;

          if (currentPath && targetIndex < currentPath.length) {
            const pt = currentPath[targetIndex];
            const bDx = pt.x - enemy.x;
            const bDy = pt.y - enemy.y;
            if (bDx !== 0 || bDy !== 0) deathAngle = Math.atan2(bDy, bDx);
          }

          // Для взрыва матки берем визуальный эффект её исходного вида
          const explosionType = enemy.type === 'boss' ? enemy.bossSpeciesSource : enemy.type;
          newExplosions.push({
            id: Math.random(),
            x: enemy.x,
            y: enemy.y,
            type: explosionType,
            angle: deathAngle,
            currentFrame: 0,
            tickCounter: 0,
            cols: 4,
            rows: 2,
            totalFrames: 8,
            animSpeed: 8,
            size: enemy.size
          });
        }
      });



      return null;
    }

    const angle = Math.atan2(dy, dx);
    return {
      ...bullet,
      x: bullet.x + Math.cos(angle) * bullet.speed,
      y: bullet.y + Math.sin(angle) * bullet.speed
    };
  }).filter(b => b !== null);

  return {
    bullets: updatedBullets,
    explosions: newExplosions,
    gold: newGold,
    damageTexts: newDamageTexts,
    newlyDroppedItems
  };
};

// --- 5. ОБНОВЛЕНИЕ КАДРОВ АНИМАЦИИ ВЗРЫВОВ И ВРАЩЕНИЯ ФОТО ---
export const updateExplosionsAnimation = (explosions) => {
  return explosions.map((exp) => {
    let nextTick = exp.tickCounter + 1;
    let nextFrame = exp.currentFrame;

    const currentAnimSpeed = exp.animSpeed || 4;

    if (nextTick >= currentAnimSpeed) {
      nextTick = 0;
      nextFrame += 1;
    }

    // Логика фазы зарождения (спрайт-лист)
    if (exp.type === 'hole_spawn') {
      if (nextFrame >= exp.totalFrames) {
        // Как только отыграли 8 кадров появления, переключаемся на режим вращения фото!
        return {
          ...exp,
          type: 'hole_loop',
          angle: 0 // Сбрасываем начальный угол вращения в ноль
        };
      }
    }
    else if (exp.type === 'hole_loop') {
      // 👈 Увеличили скорость и пустили вращение в другую сторону (минус вместо плюса)
      let currentAngle = (exp.angle || 0) - 0.15;

      // Корректное зацикливание угла для отрицательных значений
      if (currentAngle < -Math.PI * 2) currentAngle += Math.PI * 2;

      return {
        ...exp,
        angle: currentAngle
      };
    }

    else {
      // Для обычных взрывов бомб и смертей жуков: удаляем их в конце
      if (nextFrame >= exp.totalFrames) return null;
    }

    return { ...exp, tickCounter: nextTick, currentFrame: nextFrame };
  }).filter(e => e !== null);
};

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ СТРОИТЕЛЬСТВА НА ДОРОГЕ
export const checkIsOnRoad = (x, y, roadPoints) => {
  for (let i = 0; i < roadPoints.length - 1; i++) {
    const p1 = roadPoints[i];
    const p2 = roadPoints[i + 1];

    const A = x - p1.x;
    const B = y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) { xx = p1.x; yy = p1.y; }
    else if (param > 1) { xx = p2.x; yy = p2.y; }
    else { xx = p1.x + param * C; yy = p1.y + param * D; }

    const distance = Math.sqrt((x - xx) ** 2 + (y - yy) ** 2);
    if (distance < 40) return true;
  }
  return false;
};

export const generateWaveBlueprint = (waveNumber, enemyTypes, roadPaths, currentLevel, levelWaveNumber, maxWaves) => {
  const blueprint = [];

  const baseEnemiesForLevel = 8 + currentLevel * 2;
  const totalEnemies = baseEnemiesForLevel + (levelWaveNumber * 4);

  const levelGrowthRate = 0.12 + (currentLevel - 1) * 0.04;
  const difficultyMultiplier = 1 + (waveNumber - 1) * levelGrowthRate;

  const isFirstWaveOfLevel = levelWaveNumber === 0;
  const currentWaveModifier = isFirstWaveOfLevel ? 1 : waveNumber;
  const baseDelay = Math.max(35, 125 - currentWaveModifier * 4);

  let holeIndex = null;
  let holePathIndex = null;

  if (levelWaveNumber >= 4 && Math.random() < 0.4) {
    holePathIndex = Math.floor(Math.random() * roadPaths.length);
    const chosenPath = roadPaths[holePathIndex];
    if (chosenPath && chosenPath.length > 3) {
      holeIndex = Math.floor(1 + Math.random() * (chosenPath.length - 3));
    }
  }

  // Массив видов жуков по уровням для определения, чья матка идет на каком уровне
  const levelBossOrder = ['normal', 'ant', 'beetle', 'rhino', 'fly'];
  // На всякий случай закольцуем, если уровней больше 5
  const currentBossSpecies = levelBossOrder[(currentLevel - 1) % levelBossOrder.length];

  for (let i = 0; i < totalEnemies; i++) {
    let chosenType = 'normal';
    const rand = Math.random();

    if (currentLevel === 1) {
      if (levelWaveNumber === 0 || levelWaveNumber === 1) {
        chosenType = rand < 0.65 ? 'normal' : 'ant';
      } else if (levelWaveNumber === 2) {
        if (rand < 0.45) chosenType = 'normal';
        else if (rand < 0.80) chosenType = 'ant';
        else chosenType = 'beetle';
      } else if (levelWaveNumber === 3) {
        if (rand < 0.30) chosenType = 'normal';
        else if (rand < 0.60) chosenType = 'ant';
        else if (rand < 0.80) chosenType = 'beetle';
        else chosenType = 'fly';
      } else {
        if (rand < 0.20) chosenType = 'normal';
        else if (rand < 0.45) chosenType = 'ant';
        else if (rand < 0.65) chosenType = 'beetle';
        else if (rand < 0.82) chosenType = 'fly';
        else chosenType = 'rhino';
      }
    } else {
      if (levelWaveNumber === 0 || levelWaveNumber === 1 || levelWaveNumber === 2) {
        if (rand < 0.40) chosenType = 'normal';
        else if (rand < 0.75) chosenType = 'ant';
        else chosenType = 'beetle';
      } else if (levelWaveNumber === 3) {
        if (rand < 0.30) chosenType = 'normal';
        else if (rand < 0.55) chosenType = 'ant';
        else if (rand < 0.75) chosenType = 'beetle';
        else chosenType = 'fly';
      } else {
        if (rand < 0.20) chosenType = 'normal';
        else if (rand < 0.45) chosenType = 'ant';
        else if (rand < 0.65) chosenType = 'beetle';
        else if (rand < 0.82) chosenType = 'fly';
        else chosenType = 'rhino';
      }
    }

    const baseEnemy = enemyTypes[chosenType];
    const delay = i === 0 ? 30 : Math.round(baseDelay * (0.7 + Math.random() * 0.5));
    const scaledHp = Math.round(baseEnemy.hp * difficultyMultiplier);
    const scaledReward = Math.round(baseEnemy.reward + (waveNumber * 1.5));

    const assignedPathIndex = i % roadPaths.length;
    const shouldSpawnInHole = holeIndex !== null && assignedPathIndex === holePathIndex && i >= totalEnemies / 2;

    blueprint.push({
      ...baseEnemy,
      hp: scaledHp,
      maxHp: scaledHp,
      reward: scaledReward,
      delay: delay,
      assignedPathIndex,
      spawnPointIndex: shouldSpawnInHole ? holeIndex : 0
    });
  }

  // 🔥 ЭКСТРЕННАЯ ПРОВЕРКА: Проверяем, последняя ли это волна на текущем уровне
  if (levelWaveNumber === maxWaves - 1) {
    const baseBossTemplate = enemyTypes['boss'];
    const correspondingSpecies = enemyTypes[currentBossSpecies];

    // Берем ХП базового вида жука для этого уровня, умножаем на ДИФФИКУЛЬТИ и на 4!
    const bossHp = Math.round(correspondingSpecies.hp * difficultyMultiplier * 4);
    const bossReward = Math.round(baseBossTemplate.reward * difficultyMultiplier);

    // Спрайт строится по твоему правилу: /queen_cockroach.png, /queen_ant.png и т.д.
    const fileSuffix = currentBossSpecies === 'normal' ? 'cockroach' : currentBossSpecies;
    const bossSpritePath = `/queen_${fileSuffix}.png`;

    blueprint.push({
      ...baseBossTemplate,
      hp: bossHp,
      maxHp: bossHp,
      reward: bossReward,
      spritePath: bossSpritePath,
      bloodColor: correspondingSpecies.bloodColor,
      // Матка идет по случайному пути (или первому, если путь один)
      assignedPathIndex: Math.floor(Math.random() * roadPaths.length),
      spawnPointIndex: 0, // Босс всегда идет гордо с самого начала дороги
      delay: 180, // 👈 БОЛЬШОЙ ШАГ (Таймаут 3 секунды в кадрах после последнего моба)
      bossSpeciesSource: currentBossSpecies // Запоминаем, кого спавнить при смерти!
    });
  }

  return { blueprint, holeIndex, holePathIndex };
};




// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ СТРОИТЕЛЬСТВА НА ДРУГОЙ БАШНЕ
export const checkIsOnTower = (x, y, towers) => {
  for (let i = 0; i < towers.length; i++) {
    const tower = towers[i];

    // Считаем расстояние по теореме Пифагора между кликом и центром существующей башни
    const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2);

    // Если расстояние меньше, чем размер башни (или чуть меньше для комфортного зазора, например 40-45px),
    // значит клик попал на уже существующую башню
    if (distance < 45) {
      return true;
    }
  }
  return false;
};


// --- АЛГОРИТМ КРАСИВОГО ПРИМАГНИЧИВАНИЯ БАШЕН ВДОЛЬ ДОРОГИ ---
export const getSnappedPosition = (clickX, clickY, roadPoints) => {
  let bestX = clickX;
  let bestY = clickY;
  let minDistanceToRoadCenter = Infinity;

  // Идеальный отступ центра башни от ЦЕНТРА дороги.
  // Ширина дороги 55px, размер башни 50px. 
  // Чтобы башня стояла ровно рядом, но с небольшим красивым зазором в 8-10 пикселей:
  const targetOffset = 53;

  for (let i = 0; i < roadPoints.length - 1; i++) {
    const p1 = roadPoints[i];
    const p2 = roadPoints[i + 1];

    const A = clickX - p1.x;
    const B = clickY - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let closestRoadX, closestRoadY;
    if (param < 0) { closestRoadX = p1.x; closestRoadY = p1.y; }
    else if (param > 1) { closestRoadX = p2.x; closestRoadY = p2.y; }
    else { closestRoadX = p1.x + param * C; closestRoadY = p1.y + param * D; }

    const distance = Math.sqrt((clickX - closestRoadX) ** 2 + (clickY - closestRoadY) ** 2);

    if (distance < minDistanceToRoadCenter) {
      minDistanceToRoadCenter = distance;

      // Вычисляем вектор перпендикуляра от дороги к клику мыши
      const dx = clickX - closestRoadX;
      const dy = clickY - closestRoadY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);

      if (currentDist > 0) {
        // Смещаем координату строго перпендикулярно дороге на фиксированный targetOffset
        bestX = closestRoadX + (dx / currentDist) * targetOffset;
        bestY = closestRoadY + (dy / currentDist) * targetOffset;
      }
    }
  }

  return { x: bestX, y: bestY, distanceToRoad: minDistanceToRoadCenter };
};


// --- АЛГОРИТМ ПОСТРОЕНИЯ И ВАЛИДАЦИИ СЕТИ СВЯЗИ ---

export const calculateNetworkGraph = (towers, basePoint, towerTypes) => {
  // Корневой элемент — наша База
  const root = {
    id: 'base',
    x: basePoint.x - 30, // Сдвиг к иллюминаторам для красоты линий
    y: basePoint.y,
    range: 320, // Радиус покрытия базы
    maxConnections: 3,
    connectedIds: [],
    isAntenna: false,
    isActive: true
  };

  const nodes = [root];

  // Переносим существующие башни на карту нод сети
  towers.forEach(t => {
    nodes.push({
      id: t.id,
      x: t.x,
      y: t.y,
      range: t.isAntenna ? t.range : 0,
      maxConnections: t.isAntenna ? (t.maxConnections || 3) : 0,
      connectedIds: [],
      isAntenna: t.isAntenna,
      parentId: t.parentId,
      isActive: false // Изначально выключены, включим при обходе графа
    });
  });

  // Восстанавливаем связи на основе сохраненных parentId
  nodes.forEach(node => {
    if (node.parentId) {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent && parent.connectedIds.length < parent.maxConnections) {
        parent.connectedIds.push(node.id);
      }
    }
  });

  // Рекурсивная функция активации цепочки от базы
  const traverse = (currentNode) => {
    currentNode.isActive = true;
    currentNode.connectedIds.forEach(childId => {
      const child = nodes.find(n => n.id === childId);
      if (child) traverse(child);
    });
  };

  // Запускаем обход от базы
  traverse(root);

  return nodes;
};

// Поиск доступной ноды для подключения новой башни
export const findAvailableConnection = (x, y, networkGraph, towerTypes) => {
  let bestSource = null;
  let minDist = Infinity;

  networkGraph.forEach(node => {
    // Подключиться можно только к активной антенне или базе, у которой есть свободные слоты
    if (node.isActive && (node.id === 'base' || node.isAntenna)) {
      if (node.connectedIds.length < node.maxConnections) {
        const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (dist <= node.range && dist < minDist) {
          minDist = dist;
          bestSource = node;
        }
      }
    }
  });

  return bestSource;
};



