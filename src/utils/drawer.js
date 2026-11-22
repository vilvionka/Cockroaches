import { useGameStore } from '../store/gameStore';
import { assets } from './assetLoader';
import { LEVELS_CONFIG } from './../store/gameStore';

// Вспомогательный объект для сохранения углов поворота жуков
const anglesMap = {};

// --- КЕШ СТАТИЧНОЙ КАРТЫ (ФОН + ДОРОГА + ДЕКОРАЦИИ) ---
let mapCacheCanvas = null;
let cachedLevelKey = null;

export const invalidateMapCache = () => {
  cachedLevelKey = null;
};

export const drawCachedMap = (ctx, canvas, currentLevel, decorations) => {
  const decorReady = Boolean(assets.decor?.obj1?.loaded) + '_' + Boolean(assets.decor?.obj2?.loaded);
  const bgReady = Boolean(assets.bg?.loaded) + '_' + (assets.bg?.img?.src || '');
  const roadReady = Boolean(assets.roadStraight?.loaded);
  const cacheKey = `${currentLevel}_${bgReady}_${roadReady}_${decorReady}`;

  if (!mapCacheCanvas) {
    mapCacheCanvas = document.createElement('canvas');
    mapCacheCanvas.width = canvas.width;
    mapCacheCanvas.height = canvas.height;
  }

  if (cachedLevelKey !== cacheKey) {
    const offCtx = mapCacheCanvas.getContext('2d');
    offCtx.clearRect(0, 0, mapCacheCanvas.width, mapCacheCanvas.height);

    drawBackground(offCtx, mapCacheCanvas);
    drawRoad(offCtx, currentLevel);
    drawDecorations(offCtx, decorations);

    cachedLevelKey = cacheKey;
  }

  ctx.drawImage(mapCacheCanvas, 0, 0);
};


// Рисуем фон
export const drawBackground = (ctx, canvas) => {
  if (assets.bg.loaded) {
    ctx.drawImage(assets.bg.img, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

export const drawRoad = (ctx, currentLevel) => {
  const config = LEVELS_CONFIG[currentLevel];
  if (!config || !config.tileMap) return;

  const tileSize = 60; // Визуальный размер плитки

  config.tileMap.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (!tile) return;

      const x = colIndex * tileSize + tileSize / 2;
      const y = rowIndex * tileSize + tileSize / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((tile.angle * Math.PI) / 180);

      // --- ДОБАВЛЯЕМ ОБЪЕМНУЮ ТЕНЬ ДЛЯ ВСЕХ БОРТИКОВ ДОРОГИ ---
      // Глубокий полупрозрачный черный цвет для тени
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      // Радиус размытия (сделайте 12-15 для мягкого эффекта «приподнятости» над землей)
      ctx.shadowBlur = 12;
      // Смещение тени (0,0 дает равномерное затенение со всех сторон, создавая глубину)
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Выбираем нужный ассет
      let asset = null;
      if (tile.type === 'straight') asset = assets.roadStraight;
      if (tile.type === 'corner') asset = assets.roadCorner;
      if (tile.type === 't_junction') asset = assets.roadTJunction;

      if (asset && asset.loaded) {
        ctx.drawImage(asset.img, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
      } else {
        // Заглушка, если картинка потерялась (сбрасываем тень для заглушек)
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
      }

      ctx.restore();
    });
  });
};





export const drawCake = (ctx, cakePoint, cakeHp, maxCakeHp, assets, baseConnectionsCount = 0) => {
  if (!cakePoint) return;

  const baseWidth = 79;
  const baseHeight = 150;
  const drawX = cakePoint.x - baseWidth;
  const drawY = cakePoint.y - baseHeight / 2;

  // 2. База
  ctx.save();
  ctx.shadowColor = 'rgba(0, 229, 255, 0.85)';
  ctx.shadowBlur = 18;
  if (assets?.base?.loaded) {
    ctx.drawImage(assets.base.img, drawX, drawY, baseWidth, baseHeight);
  } else {
    ctx.fillStyle = '#E91E63';
    ctx.fillRect(cakePoint.x - 40, cakePoint.y - 50, 40, 100);
  }
  ctx.restore();
};





// --- ИСПРАВЛЕННЫЙ ОТРЕНДЕР БАШЕН С БЕЗОПАСНЫМИ ТЕНЯМИ И ФИКСOМ РАЗМЫТИЯ ЭКРАНА ---
export const drawTowers = (ctx, towers) => {
  const safeTowers = towers || [];

  // Достаем ID выбранной башни из хранилища Zustand напрямую
  const selectedTowerId = useGameStore.getState().selectedTowerId;

  safeTowers.forEach((tower) => {
    const isFocused = tower.id === selectedTowerId;

    // 1. Если по башне тапнули — подсвечиваем её радиус стрельбы
    // 1. Если по башне тапнули — подсвечиваем её радиус стрельбы
    if (isFocused) {
      ctx.save();

      let visualRange = tower.range;
      if (tower.activeBoosts?.range > 0) {
        visualRange = Math.round(tower.range * 1.5);
      }

      // Внешний радиус поражения
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, visualRange, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Если есть мёртвая зона (РСЗО) — рисуем внутренний запретный круг
      if (tower.minRange) {
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.minRange, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 82, 82, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 82, 82, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }


    if (tower.minRange) {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.minRange, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 82, 82, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.45)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }


    // --- 2. ЛЁГКАЯ ТЕНЬ ОТ БАШНИ (БЕЗ ctx.filter) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(tower.x + 1, tower.y + 1, tower.size / 2.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tower.x + 1, tower.y + 1, tower.size / 2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();
    ctx.restore();


    // --- 3. РАСЧЕТ ОТДАЧИ И ОТРИСОВКА СПРАЙТА БАШНИ ---
    ctx.save();
    const recoil = tower.recoilOffset || 0;
    const recoilX = -Math.cos(tower.angle) * recoil;
    const recoilY = -Math.sin(tower.angle) * recoil;

    ctx.translate(tower.x + recoilX, tower.y + recoilY);
    ctx.rotate(tower.angle + Math.PI / 2);

    const towerAsset = assets.towers?.[tower.type];

    if (towerAsset?.loaded) {
      const offsetX = -tower.size / 2;

      // Если это ракетная шахта (silo), центрируем её строго по центру (0.5).
      // Для остальных оборонительных башен сохраняем ваш рабочий сдвиг 0.58.
      const offsetY = tower.isRocketSilo ? -tower.size / 2 : -tower.size * 0.58;

      ctx.drawImage(towerAsset.img, offsetX, offsetY, tower.size, tower.size);
    } else {
      ctx.fillStyle = tower.type === 'bomb' ? '#FF9800' : tower.type === 'frost' ? '#00BCD4' : '#1E88E5';
      ctx.fillRect(-tower.size / 2, -tower.size / 2, tower.size, tower.size);
    }
    ctx.restore();

    // --- 4. ОТРИСОВКА МЕТКИ УРОВНЯ БАШНИ (Прямо под ней) ---
    if (!tower.isAntenna) {
      ctx.save();
      const currentLevel = tower.level || 1;
      ctx.font = 'bold 9px "Orbitron", Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = isFocused ? '#00e5ff' : 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;

      const labelY = tower.y + tower.size / 2 + 10;
      ctx.strokeText(`LVL ${currentLevel}`, tower.x, labelY);
      ctx.fillText(`LVL ${currentLevel}`, tower.x, labelY);
      ctx.restore();
    }

    // --- 5. ОТРИСОВКА ИНДИКАТOРА СТРОИТЕЛЬСТВА / АПГРЕЙДА ---
    if (tower.underConstruction && tower.constructionTimer > 0) {
      ctx.save();
      const barW = 44;
      const barH = 5;
      const barX = tower.x - barW / 2;
      const barY = tower.y - tower.size / 2 - 12;

      // Задний фон полоски (серый)
      ctx.fillStyle = 'rgba(20, 30, 40, 0.75)';
      ctx.fillRect(barX, barY, barW, barH);

      // Рассчитываем процент готовности
      const progress = 1 - (tower.constructionTimer / tower.maxConstructionTime);

      // Цвет: оранжевый для апгрейда, бирюзовый для новой постройки
      ctx.fillStyle = tower.constructionType === 'upgrade' ? '#FF9800' : '#00e5ff';
      ctx.fillRect(barX, barY, barW * progress, barH);

      // Обводка полоски прогресса
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.restore();
    }


    // --- 6. ИНДИКАТОР ЗАРЯДКИ РАКЕТНОЙ ШАХТЫ НАД БАШНЕЙ ---
    if (tower.isRocketSilo && !tower.underConstruction) {
      ctx.save();
      const markerY = tower.y - tower.size / 2 - 14;
      const isReady = (tower.ammoReady || 0) > 0;

      if (isReady) {
        // Пульсирующая надпись "ГОТОВ!"
        const pulse = 0.8 + Math.sin(Date.now() / 180) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.font = 'bold 10px "Orbitron", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('ГОТОВ!', tower.x, markerY);
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('ГОТОВ!', tower.x, markerY);
      } else {
        // Заполняющийся кружочек зарядки (макс. время зарядки = 1500 кадров)
        const maxCharge = 1500;
        const chargeLeft = tower.chargeTimer ?? maxCharge;
        const progress = Math.min(1, Math.max(0, 1 - chargeLeft / maxCharge));
        const radius = 9;

        // Тёмная подложка кружка
        ctx.beginPath();
        ctx.arc(tower.x, markerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 12, 20, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Заполняющийся сектор (от -90 градусов по часовой стрелке)
        if (progress > 0) {
          ctx.beginPath();
          ctx.moveTo(tower.x, markerY);
          ctx.arc(
            tower.x,
            markerY,
            radius - 1,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress
          );
          ctx.closePath();
          ctx.fillStyle = '#FF9800';
          ctx.fill();
        }

        // Тонкий внешний ободок прогресса
        ctx.beginPath();
        ctx.arc(
          tower.x,
          markerY,
          radius,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * progress
        );
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }


  });
};



// --- ИСПРАВЛЕННАЯ ОТРИСОВКА ВРАГОВ С БЕЗОПАСНЫМИ ТЕНЯМИ И Z-СОРТИРОВКОЙ ---
export const drawEnemies = (ctx, enemies, roadPaths) => {
  const safeEnemies = enemies || [];
  const safePaths = roadPaths || [];

  // Сортируем жуков по размеру от меньшего к большему:
  // мелкие рисуются первыми (внизу), крупные — поверх них (сверху)
  const sortedEnemies = [...safeEnemies].sort((a, b) => (a.size || 0) - (b.size || 0));

  sortedEnemies.forEach((enemy) => {
    const currentPath = safePaths[enemy.assignedPathIndex || 0] || [];
    const targetIndex = enemy.currentPointIndex + 1;
    let currentAngle = anglesMap[enemy.id] || 0;

    if (currentPath && targetIndex < currentPath.length) {
      const target = currentPath[targetIndex];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      if (dx !== 0 || dy !== 0) {
        currentAngle = Math.atan2(dy, dx);
        anglesMap[enemy.id] = currentAngle;
      }
    }

    const assetKey = enemy.type === 'boss' ? `queen_${enemy.bossSpeciesSource}` : enemy.type;
    const rawAsset = assets.sprites?.[assetKey];
    const spriteAsset = rawAsset?.loaded
      ? rawAsset
      : enemy.type === 'boss'
        ? (assets.sprites?.queen_cockroach?.loaded ? assets.sprites.queen_cockroach : assets.sprites?.queen_ant)
        : rawAsset;


    // --- 1. БЫСТРАЯ ТЕНЬ ЖУКА ОВАЛОМ (БЕЗ ctx.filter) ---
    ctx.save();
    ctx.translate(enemy.x + 1, enemy.y + 2);
    ctx.rotate(currentAngle + Math.PI / 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.size * 0.19, enemy.size * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.size * 0.22, enemy.size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();


    // --- 2. ОТРИСОВКА САМОГО ЖУКА (ПОВЕРХ ТЕНИ) ---
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(currentAngle + Math.PI / 2);

    const offsetX = enemy.frameOffsetsX ? enemy.frameOffsetsX[enemy.currentFrame] : 0;

    if (spriteAsset?.loaded) {
      const frameWidth = enemy.imgWidth / enemy.cols;
      const frameHeight = enemy.imgHeight / enemy.rows;
      const colIndex = enemy.currentFrame % enemy.cols;
      const rowIndex = Math.floor(enemy.currentFrame / enemy.cols);

      ctx.drawImage(
        spriteAsset.img,
        colIndex * frameWidth, rowIndex * frameHeight, frameWidth, frameHeight,
        (-enemy.size / 2) + offsetX, -enemy.size / 2, enemy.size, enemy.size
      );
    } else {
      ctx.fillStyle = enemy.type === 'ant' ? '#795548' : enemy.type === 'beetle' ? '#3F51B5' : '#A1613A';
      ctx.fillRect(-enemy.size / 2, -enemy.size / 4, enemy.size, enemy.size / 2);
    }

    if (enemy.slowTimer > 0) {
      ctx.fillStyle = 'rgba(0, 188, 212, 0.35)';
      ctx.beginPath(); ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // 3. Здоровье жука над ним
    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x - 15, enemy.y - enemy.size / 2 - 5, 30, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x - 15, enemy.y - enemy.size / 2 - 5, (enemy.hp / enemy.maxHp) * 30, 4);
    }
  });
};




// Рисуем пули
export const drawBullets = (ctx, bullets) => {

  bullets.forEach((bullet) => {
    if (bullet.launchDelay > 0) return;
    ctx.fillStyle = bullet.bulletType === 'frost' ? '#00E5FF' : '#FFEB3B'; // Ледяная пуля — голубая неон, обычная — желтая
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2); // Снаряд фроста сделаем чуть крупнее (3px вместо 2px)
    ctx.fill();
  });
};


// Рисуем взрывы и плавно вращающуюся цельную черную дыру
export const drawExplosions = (ctx, explosions) => {
  explosions.forEach((exp) => {
    const expAsset = assets.explosions[exp.type];

    if (expAsset?.loaded && expAsset.img.naturalWidth > 0) {
      // === 1. ВАРИАНТ ДЛЯ ЦЕЛЬНОГО ФОТО ЧЕРНОЙ ДЫРЫ (Идеально ровный центр) ===
      // === 1. ВАРИАНТ ДЛЯ ЦЕЛЬНОГО ФОТО ЧЕРНОЙ ДЫРЫ (Защита от перекосов) ===
      if (exp.type === 'hole_loop') {
        ctx.save();

        // 🪛 ЖЕСТКИЙ СБРОС МАТРИЦЫ: убирает любые перекосы плоскости от предыдущих элементов
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Переносим координаты вручную на чистую 2D сетку
        ctx.translate(Math.round(exp.x), Math.round(exp.y));
        ctx.rotate(exp.angle);

        ctx.drawImage(
          expAsset.img,
          -exp.size / 2, // Строго по центру X
          -exp.size / 2, // Строго по центру Y
          exp.size,
          exp.size
        );

        ctx.restore();
      }

      // === 2. ВАРИАНТ ДЛЯ ВСЕХ ОСТАЛЬНЫХ СПРАЙТ-ЛИСТОВ (hole_spawn, бомбарды, жуки) ===
      else {
        ctx.save();
        ctx.translate(Math.round(exp.x), Math.round(exp.y));
        ctx.rotate(exp.angle);

        const expFrameWidth = expAsset.img.naturalWidth / (exp.cols || 1);
        const expFrameHeight = expAsset.img.naturalHeight / (exp.rows || 1);
        const colIndex = exp.currentFrame % (exp.cols || 1);
        const rowIndex = Math.floor(exp.currentFrame / (exp.cols || 1));

        // Доворот на 90 градусов нужен ТОЛЬКО для спрайтов смертей жуков, но НЕ для спавна дыры
        if (exp.type !== 'hole_spawn') {
          ctx.rotate(Math.PI / 2);
        }

        if (exp.currentFrame >= 5 && exp.type !== 'hole_spawn') {
          ctx.globalAlpha = Math.max(0.1, 1 - ((exp.currentFrame - 4) / 4));
        }

        ctx.drawImage(
          expAsset.img,
          colIndex * expFrameWidth, rowIndex * expFrameHeight, expFrameWidth, expFrameHeight,
          -exp.size / 2, -exp.size / 2, exp.size, exp.size
        );
        ctx.restore();
      }
    } else {
      // Цветная заглушка-круг, если картинка потерялась
      ctx.save();
      ctx.translate(exp.x, exp.y);
      const color = exp.type.includes('hole') ? '33, 21, 18' : '255, 152, 0';
      ctx.fillStyle = `rgba(${color}, 0.7)`;
      ctx.beginPath();
      ctx.arc(0, 0, exp.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
};


// Рисуем интерфейс (таймер и Game Over)
export const drawUI = (ctx, canvas, waveActive, waveTimer, gameOver) => {
  // Экран Game Over теперь рендерится как полноценный Sci-Fi оверлей поверх всего интерфейса
};

// Рисуем провал дороги (ЗАЩИЩЕНО ОТ UNDEFINED)
export const drawRoadHole = (ctx, activeHoleIndex, roadPaths, activeHolePathIndex) => {
  if (activeHoleIndex === null || !roadPaths) return;

  const currentPath = roadPaths[activeHolePathIndex || 0];
  if (!currentPath || !currentPath[activeHoleIndex]) return;

  const holePoint = currentPath[activeHoleIndex];

  ctx.save();
  ctx.translate(holePoint.x, holePoint.y);

  const pulse = Math.sin(Date.now() / 150) * 3;
  const radius = 28 + pulse;

  ctx.fillStyle = 'rgba(62, 39, 35, 0.4)';
  ctx.beginPath(); ctx.arc(0, 0, radius + 8, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#211512';
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(radius - 5, 0); ctx.lineTo(radius + 15, 5 - Math.random() * 10); ctx.stroke();
  }

  ctx.restore();
};



// --- ОТРИСОВКА МОБИЛЬНОГО ПРИЗРАКА БАШНИ И РАДИУСА ---
export const drawBuildPreview = (ctx, preview, assets) => {
  if (!preview) return;


  const previewConfig = useGameStore.getState().towerTypes?.[preview.type];
  if (previewConfig?.minRange) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(preview.x, preview.y, previewConfig.minRange, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 82, 82, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 82, 82, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  }


  // 1. Рисуем бирюзовый круг радиуса действия башни
  ctx.save();
  ctx.beginPath();
  ctx.arc(preview.x, preview.y, preview.range, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.08)'; // Очень нежная заливка
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)'; // Неоновый пунктир или тонкая линия
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]); // Пунктирная линия в Sci-Fi стиле
  ctx.stroke();
  ctx.restore();

  // 2. Рисуем полупрозрачный спрайт самой башни
  ctx.save();
  ctx.translate(preview.x, preview.y);
  ctx.globalAlpha = 0.55; // Делаем башню полупрозрачной ghost-эффект

  const towerAsset = assets.towers?.[preview.type];
  if (towerAsset?.loaded) {
    ctx.drawImage(
      towerAsset.img,
      -preview.size / 2,
      -preview.size / 2,
      preview.size,
      preview.size
    );
  } else {
    // Цветная заглушка
    ctx.fillStyle = preview.type === 'bomb' ? '#FF9800' : preview.type === 'frost' ? '#00BCD4' : '#1E88E5';
    ctx.fillRect(-preview.size / 2, -preview.size / 2, preview.size, preview.size);
  }
  ctx.restore();

  // 3. Маленькие мобильные интерфейсные кнопки подтверждения ПРЯМО НА КАНВАСЕ рядом с башней
  // Рисуем круги-подложки под кнопки (Зеленый "ОК" справа-вверху, Красный "Х" слева-вверху)
  const btnRadius = 14;

  // Кнопка подтверждения (Галочка)
  ctx.save();
  ctx.beginPath();
  ctx.arc(preview.x + 30, preview.y - 30, btnRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#4CAF50';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', preview.x + 30, preview.y - 30);
  ctx.restore();

  // Кнопка отмены (Крестик)
  ctx.save();
  ctx.beginPath();
  ctx.arc(preview.x - 30, preview.y - 30, btnRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#FF5252';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', preview.x - 30, preview.y - 30);
  ctx.restore();
};

export const drawDamageTexts = (ctx, damageTexts) => {
  if (!damageTexts) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  damageTexts.forEach((txt) => {
    ctx.globalAlpha = Math.max(0, txt.alpha);
    ctx.fillStyle = txt.color;

    if (txt.isAlert) {
      ctx.font = 'bold 13px "Orbitron", Arial';
    } else if (txt.isCrit) {
      ctx.font = 'bold 20px "Montserrat", Arial';
    } else if (txt.isMiss) {
      ctx.font = 'bold 12px "Orbitron", Arial';
    } else {
      ctx.font = '13px "Montserrat", Arial';
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = txt.isAlert || txt.isCrit ? 4 : 3;
    ctx.strokeText(txt.text, txt.x, txt.y);

    ctx.fillText(txt.text, txt.x, txt.y);
  });


  ctx.restore();
};



// --- ОТРИСОВКА ВЫПАВШИХ ПРЕДМЕТОВ (МОНЕТЫ И БУСТЫ) ---
export const drawDroppedItems = (ctx, droppedItems) => {
  if (!droppedItems) return;

  droppedItems.forEach((item) => {
    ctx.save();

    // Эффект пульсации (мигание перед исчезновением)
    let alpha = 1;
    if (item.timer < 60) {
      // Последнюю секунду предмет начинает мигать
      alpha = Math.sin(Date.now() / 80) * 0.4 + 0.6;
    }
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);

    if (item.boostType === 'gold') {
      // Красивая золотая монета
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#B48A00';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = '9px "Orbitron"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', item.x, item.y);
    } else {
      // Игры в стиле киберпанк — неоновые контейнеры бустов
      ctx.fillStyle = 'rgba(0, 10, 20, 0.8)';
      ctx.fill();

      // Цвет обводки зависит от типа буста
      ctx.strokeStyle = item.boostType === 'damage' ? '#FF5252' : item.boostType === 'fireRate' ? '#FF9800' : '#00E5FF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Буква буста внутри
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 9px "Orbitron"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const letter = item.boostType === 'damage' ? 'D' : item.boostType === 'fireRate' ? 'F' : 'R';
      ctx.fillText(letter, item.x, item.y);
    }

    ctx.restore();
  });
};

// --- КИБЕРПАНК СИСТЕМА ОТРИСОВКИ ЧАСТИЦ (ВСПЫШКИ, ГИЛЬЗЫ, ИНОПЛАНЕТНАЯ КРОВЬ) ---
export const drawParticles = (ctx, particles) => {
  if (!particles) return;

  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha || 1; // Учитываем плавное затухание

    if (p.type === 'blood') {
      // 1. Отрисовка инопланетной жижи жуков
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;

      // Добавляем неоновый ореол брызгам для Sci-Fi стиля
      ctx.fill();
    }
    else if (p.type === 'shell') {
      // 2. Отрисовка летящих и кувыркающихся пулеметных гильз
      ctx.save();
      ctx.translate(p.x, p.y); // Переносим центр координат в гильзу
      ctx.rotate(p.angle);    // Поворачиваем холст на её текущий угол вращения

      ctx.strokeStyle = '#ffd700'; // Золотой Sci-Fi цвет гильзы
      ctx.lineWidth = 1;           // Сделаем её чуть толще для лучшей видимости
      ctx.lineCap = 'round';

      ctx.beginPath();
      // Рисуем маленькую палочку гильзы длиной 5 пикселей прямо по центру вращения
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(2.5, 0);
      ctx.stroke();

      // Добавим легкий неоновый отблеск горячей гильзе
      ctx.strokeStyle = 'rgba(255, 152, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    else if (p.type === 'flash') {
      // 3. Вспышка дульного пламени в момент выстрела
      // ИСПРАВЛЕНИЕ: Жесткая проверка на валидность чисел (защита от NaN и Infinite)
      if (Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.size) && p.size > 0) {
        ctx.globalCompositeOperation = 'screen'; // Эффект свечения огня

        let gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);

        if (p.bulletType === 'frost') {
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 60, 75, 0)');
        } else {
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, 'rgba(255, 152, 0, 0.8)'); // Оранжевое пламя
          gradient.addColorStop(1, 'rgba(180, 70, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  });
};


// --- ОТРИСОВКА НЕОНОВЫХ ЛИНИЙ СВЯЗИ И ЗАМЕТНЫХ ЗОН ПОКРЫТИЯ ---
export const drawNetworkLines = (ctx, networkGraph, buildPreview, selectedTowerType = null) => {
  if (!networkGraph) return;

  // 1. Лазерные линии соединений между узлами (оставляем без изменений)
  networkGraph.forEach(node => {
    if (node.parentId) {
      const parent = networkGraph.find(n => n.id === node.parentId);
      if (parent) {
        ctx.save();
        ctx.lineWidth = 4;
        if (node.isActive) {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
          ctx.shadowColor = '#00E5FF';
        } else {
          ctx.strokeStyle = 'rgba(255, 82, 82, 0.2)';
          ctx.shadowColor = '#FF5252';
        }
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = node.isActive ? '#FFFFFF' : '#FF8A80';
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -Math.floor(Date.now() / 50) % 10;
        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  });

  // 2. Показываем зоны покрытия сразу при выборе башни в магазине ИЛИ при перемещении призрака
  const showNetworkZones = Boolean(buildPreview || (selectedTowerType && selectedTowerType !== 'silo'));

  if (showNetworkZones) {
    ctx.save();
    networkGraph.forEach(node => {
      // Показываем зоны только от активных узлов (Базы и запитанных антенн)
      if (node.isActive && (node.id === 'base' || node.isAntenna)) {
        const hasFreeSlots = node.connectedIds.length < node.maxConnections;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.range, 0, Math.PI * 2);

        if (hasFreeSlots) {
          // Свободные слоты есть: яркая бирюзовая зона с четким контуром и легким свечением
          ctx.fillStyle = 'rgba(0, 229, 255, 0.11)';
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
          ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 6]); // Крупный четкий пунктир
        } else {
          // Слоты заполнены: заметная янтарно-оранжевая зона
          ctx.fillStyle = 'rgba(255, 152, 0, 0.08)';
          ctx.strokeStyle = 'rgba(255, 152, 0, 0.55)';
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
        }

        ctx.fill();
        ctx.stroke();
      }
    });
    ctx.restore();
  }
};



// Отрисовка площадки под супероружие + целеуказатель при выборе в магазине
export const drawRocketPad = (ctx, currentLevel, isSiloSelected = false) => {
  const config = LEVELS_CONFIG[currentLevel];
  if (!config || !config.rocketPad) return;

  const pad = config.rocketPad;
  const padSize = 70; // Размер картинки площадки в пикселях (можете подстроить под свой спрайт)

  // 1. Отрисовка картинки стройплощадки вместо круга и надписи LAUNCH PAD
  if (assets.rocketPad?.loaded) {
    ctx.drawImage(
      assets.rocketPad.img,
      pad.x - padSize / 2,
      pad.y - padSize / 2,
      padSize,
      padSize
    );
  }

  // 2. ЯРКИЙ УКАЗАТЕЛЬ И ПУЛЬСАЦИЯ, КОГДА ВЫБРАНА РАКЕТНАЯ ШАХТА В МАГАЗИНЕ
  if (isSiloSelected) {
    ctx.save();

    const pulse = Math.sin(Date.now() / 160); // Плавная синусоида от -1 до 1
    const ringRadius = 36 + pulse * 4;
    const bounceY = pulse * 5; // Амплитуда подпрыгивания стрелки (5 px)

    // Пульсирующее неоновое кольцо вокруг площадки
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 14;
    ctx.setLineDash([8, 4]);
    ctx.stroke();

    // Подпрыгивающая стрелка-указатель над площадкой
    const arrowTipY = pad.y - 46 + bounceY;
    const arrowTopY = arrowTipY - 18;

    ctx.setLineDash([]);
    ctx.fillStyle = '#00E5FF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Рисуем стрелку вниз (хвостовик + треугольный наконечник)
    ctx.beginPath();
    ctx.moveTo(pad.x - 5, arrowTopY);
    ctx.lineTo(pad.x + 5, arrowTopY);
    ctx.lineTo(pad.x + 5, arrowTipY - 8);
    ctx.lineTo(pad.x + 12, arrowTipY - 8);
    ctx.lineTo(pad.x, arrowTipY);
    ctx.lineTo(pad.x - 12, arrowTipY - 8);
    ctx.lineTo(pad.x - 5, arrowTipY - 8);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    // Подпись над стрелкой
    ctx.font = 'bold 10px "Orbitron", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeText('СТРОЙПЛОЩАДКА', pad.x, arrowTopY - 4);
    ctx.fillText('СТРОЙПЛОЩАДКА', pad.x, arrowTopY - 4);

    ctx.restore();
  }
};



export const drawFlyingRockets = (ctx, flyingRockets) => {
  if (!flyingRockets) return;

  flyingRockets.forEach(r => {
    ctx.save();
    // Рисуем точку падения (красный мигающий маркер прицела на дороге)
    const pulse = Math.sin(Date.now() / 80) * 4 + 10;
    ctx.strokeStyle = '#FF3D00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r.targetX, r.targetY, pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Рисуем саму ракету (неоновый треугольник или кружок с огненным шлейфом)
    ctx.translate(r.currentX, r.currentY);

    // Хвост ракеты
    let gradient = ctx.createRadialGradient(0, 0, 1, -5, 0, 12);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, 'rgba(230, 81, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();

    // 👈 ОТРИСОВКА КАРТИНКИ РАКЕТЫ
    if (assets.silo_rocket?.loaded) {
      const size = r.spec === 'nuke' ? 32 : 24; // Ядерная МБР чуть крупнее обычной
      ctx.drawImage(
        assets.silo_rocket.img,
        -size / 2, // Центрируем по оси X
        -size / 2, // Центрируем по оси Y
        size,
        size
      );
    } else {
      // Заглушка, если картинка не загрузилась
      ctx.fillStyle = r.spec === 'nuke' ? '#FF3D00' : '#ECEFF1';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  });
};

export const drawDecorations = (ctx, decorations) => {
  if (!decorations) return;

  decorations.forEach((dec) => {
    const asset = assets.decor?.[dec.type];

    if (asset && asset.loaded && asset.img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(dec.x, dec.y);

      // Рисуем цельное изображение без нарезки
      ctx.drawImage(
        asset.img,
        -dec.size / 2,
        -dec.size / 2,
        dec.size,
        dec.size
      );

      ctx.restore();
    } else {
      // Заглушка, если файл не найден
      ctx.save();
      ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
      ctx.fillRect(dec.x - dec.size / 2, dec.y - dec.size / 2, dec.size, dec.size);
      ctx.restore();
    }
  });
};

export const drawScorches = (ctx, scorches) => {
  if (!scorches) return;

  scorches.forEach((s) => {
    const asset = assets.scorchCrater;

    if (asset && asset.loaded && asset.img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      // Эффект плавного растворения: в последние 5 секунд след начинает плавно таять
      if (s.timer < 300) {
        ctx.globalAlpha = s.timer / 300;
      } else {
        ctx.globalAlpha = 0.9; // Слегка приглушим прозрачность, чтобы сквозь края была видна дорога
      }

      ctx.drawImage(asset.img, -s.size / 2, -s.size / 2, s.size, s.size);
      ctx.restore();
    }
  });
};

export const drawSlimeTrails = (ctx, slimeTrails) => {
  if (!slimeTrails || slimeTrails.length === 0) return;

  ctx.save();
  slimeTrails.forEach((trail) => {
    ctx.globalAlpha = (trail.timer / trail.maxTimer) * 0.5;
    ctx.fillStyle = trail.color;
    ctx.beginPath();
    ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};


// --- ОТРИСОВКА МЕРЦАЮЩЕГО БИОПОЛЯ БАЗЫ (КОРРЕКЦИЯ ЦВЕТА И СДВИГА) ---
export const drawBaseShield = (ctx, cakePoint, shieldFlashTimer) => {
  if (!cakePoint) return;

  // Уменьшаем радиус до 95 и двигаем центр вправо (+15 вместо -30), чтобы купол идеально облегал круглую базу
  const shieldRadius = 95;
  const flashFramesMax = 30;

  // ⚡ ШТАТНЫЙ ЦВЕТ: Едва заметное, мягкое бирюзово-голубое свечение в тон иллюминаторам базы
  let alpha = 0.04;
  let shieldColor = '0, 229, 255';

  // 💥 ЦВЕТ ПРИ УДАРЕ: Контрастный неоновый янтарно-красный (противоположный голубому на цветовом круге)
  if (shieldFlashTimer > 0) {
    const flashRatio = shieldFlashTimer / flashFramesMax;
    alpha = 0.04 + flashRatio * 0.5; // Делаем вспышку насыщенной
    shieldColor = '255, 87, 34';    // Точный Sci-Fi янтарно-оранжево-красный оттенок (RGB)
  }

  ctx.save();

  // Смещаем центр полусферы ближе к телу базы (+15 пикселей по X от точки входа)
  const shieldX = cakePoint.x + 15;
  const shieldY = cakePoint.y;

  ctx.beginPath();
  ctx.arc(shieldX, shieldY, shieldRadius, -Math.PI / 2, Math.PI / 2, true);

  // 1. Объемный внутренний градиент
  let gradient = ctx.createRadialGradient(
    shieldX, shieldY, 10,
    shieldX, shieldY, shieldRadius
  );
  gradient.addColorStop(0, `rgba(${shieldColor}, 0)`);
  gradient.addColorStop(0.75, `rgba(${shieldColor}, ${alpha * 0.25})`);
  gradient.addColorStop(1, `rgba(${shieldColor}, ${alpha})`);

  ctx.fillStyle = gradient;
  ctx.fill();

  // 2. Внешняя силовая кромка поля с неоновым отсветом
  ctx.strokeStyle = `rgba(${shieldColor}, ${alpha * 1.6})`;
  ctx.lineWidth = shieldFlashTimer > 0 ? 3.5 : 1.2;
  ctx.shadowColor = `rgba(${shieldColor}, 1)`;
  ctx.shadowBlur = shieldFlashTimer > 0 ? 16 : 3;
  ctx.stroke();

  ctx.shadowBlur = 0; // Сброс тени для оптимизации сетки

  // 3. Энергетическая векторная сетка
  ctx.strokeStyle = `rgba(${shieldColor}, ${alpha * 0.35})`;
  ctx.lineWidth = 1;

  // Концентрические дуги силового поля
  for (let r = 25; r < shieldRadius; r += 22) {
    ctx.beginPath();
    ctx.arc(shieldX, shieldY, r, -Math.PI / 2, Math.PI / 2, true);
    ctx.stroke();
  }

  // Разомкнутые силовые лучи
  const rayCount = 8;
  for (let i = 0; i <= rayCount; i++) {
    const angle = -Math.PI / 2 + (Math.PI / rayCount) * i;
    const startX = shieldX;
    const startY = shieldY;
    const endX = startX + Math.cos(angle) * shieldRadius;
    const endY = startY + Math.sin(angle) * shieldRadius;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
};

// --- ОТРИСОВКА ИНДИКАТОРОВ ПОДКЛЮЧЕНИЙ С ВЕКТОРНЫМ ЗНАЧКОМ WI-FI ---
export const drawNetworkConnectionsHud = (ctx, networkGraph) => {
  if (!networkGraph || networkGraph.length === 0) return;

  networkGraph.forEach((node) => {
    // Нас интересуют только База и Модули связи (антенны)
    const isBase = node.id === 'base';
    if (!isBase && !node.isAntenna) return;

    ctx.save();

    // Смещаем координаты НАВЕРХ (выше макушек построек)
    // База высокая (150px), поэтому поднимаем маркер на -85px. Антенны — на -35px.
    const x = isBase ? node.x - 15 : node.x;
    const y = isBase ? node.y - 85 : node.y - 35;

    const currentConnections = node.connectedIds ? node.connectedIds.length : 0;
    const maxConnections = node.maxConnections || 3;
    const isFull = currentConnections >= maxConnections;

    // Бирюзовый неон по умолчанию, оранжевый — если все слоты заняты
    const hudColor = isFull ? '#FF9800' : '#00e5ff';

    // Черная обводка для лазерной четкости элементов на любом фоне
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    // ====================================================
    // 📶 ЧАСТЬ 1: РИСУЕМ КАСТOМНЫЙ ВЕКТОРНЫЙ ЗНАЧОК WI-FI
    // ====================================================
    // Сдвигаем центр рисования иконки чуть левее от центра текста
    const iconX = x - 14;
    const iconY = y + 2; // Небольшая балансировка по вертикали

    // Включаем сглаживание линий и круглые наконечники
    ctx.lineCap = 'round';

    // 1. Отрисовка центральной точки-передатчика
    ctx.beginPath();
    ctx.arc(iconX, iconY, 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = hudColor;
    ctx.fill();

    // 2. Отрисовка трёх концентрических дуг (волн сигнала)
    // Рисуем дуги сверху вниз: от угла -135 градусов (-Math.PI * 0.75) до -45 градусов (-Math.PI * 0.25)
    const angleStart = -Math.PI * 0.75;
    const angleEnd = -Math.PI * 0.25;

    // Радиусы для 3-х волн сигнала
    const radii = [4.5, 8, 11.5];

    radii.forEach((r) => {
      ctx.beginPath();
      ctx.arc(iconX, iconY, r, angleStart, angleEnd, false);

      // Сначала делаем черную подложку-обводку
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Накладываем цветной неоновый слой
      ctx.strokeStyle = hudColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // ====================================================
    // 📊 ЧАСТЬ 2: ВЫВОДИМ ЦИФРОВОЙ СЧЕТЧИК (например, 1/3)
    // ====================================================
    ctx.font = 'bold 10px "Orbitron", Arial';
    ctx.textAlign = 'left'; // Выравнивание по левому краю, так как иконка стоит слева
    ctx.textBaseline = 'middle';

    const textX = x + 2; // Сдвигаем цифры вправо, чтобы они не наезжали на иконку
    const labelText = `${currentConnections}/${maxConnections}`;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeText(labelText, textX, y);

    ctx.fillStyle = hudColor;
    ctx.fillText(labelText, textX, y);

    ctx.restore();
  });
};

// --- ОТРИСОВКА ТАКТИЧЕСКОГО ПРИЦЕЛА ДЛЯ РАКЕТНОЙ ШАХТЫ ---
export const drawRocketAim = (ctx, aimPos, isValidTarget, blastRadius = 65) => {
  if (!aimPos) return;

  const { x, y } = aimPos;
  const color = isValidTarget ? '#00E5FF' : '#FF5252';
  const fillBg = isValidTarget ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 82, 82, 0.14)';

  ctx.save();
  ctx.translate(x, y);

  // 1. Зона будущего поражения (радиус взрыва)
  ctx.beginPath();
  ctx.arc(0, 0, blastRadius, 0, Math.PI * 2);
  ctx.fillStyle = fillBg;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Вращающееся внутреннее кольцо прицела
  const rot = (Date.now() / 600) % (Math.PI * 2);
  ctx.save();
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4 тактические засечки по кругу
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Перекрестие или знак запрета в центре
  if (isValidTarget) {
    // Центральная точка наведения
    ctx.fillStyle = '#FF3D00';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Диагональная черта запрета поверх внутреннего круга
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // 4. Подпись под прицелом
  ctx.font = 'bold 10px "Orbitron", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  const label = isValidTarget ? 'УДАР РАЗРЕШЁН' : 'ТОЛЬКО ПО ДОРОГЕ';
  ctx.strokeText(label, 0, 28);
  ctx.fillStyle = color;
  ctx.fillText(label, 0, 28);

  ctx.restore();
};



