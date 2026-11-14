import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
// 👈 ИСПРАВЛЯЕМ ЭТУ СТРОКУ (Добавляем импорт loadLevelDecor):
import { loadAllAssets, loadLevelDecor, assets } from '../utils/assetLoader';
import * as drawer from '../utils/drawer';
import * as gameHelpers from '../store/gameHelpers';
import { LEVELS_CONFIG } from '../store/gameStore'; // Также подтянем конфиг для безопасности


export const GameCanvas = () => {
  const canvasRef = useRef(null);
  const buyAndPlaceTower = useGameStore((state) => state.buyAndPlaceTower);
  const confirmPlacement = useGameStore((state) => state.confirmPlacement);
  const cancelPlacement = useGameStore((state) => state.cancelPlacement);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const state = useGameStore.getState();

    if (state.isAimingRocket) {
      let hitRoad = false;

      // ИСПРАВЛЕНО: Используем чистый gameHelpers, импортированный на самом верху файла
      for (let path of state.roadPaths) {
        if (gameHelpers.checkIsOnRoad(clickX, clickY, path)) {
          hitRoad = true;
          break;
        }
      }

      if (hitRoad) {
        useGameStore.getState().launchRocket(clickX, clickY);
      } else {
        // Если ткнули мимо дороги — сбрасываем режим, чтобы не блокировать интерфейс
        useGameStore.setState({ isAimingRocket: false });
      }
      return; // Железно прерываем выполнение, чтобы клик не ушел под дорогу
    }

    // ПРОВЕРКА: Тапнули ли по лежащему на земле предмету?
    const clickedItem = state.droppedItems.find((item) => {
      const dist = Math.sqrt((clickX - item.x) ** 2 + (clickY - item.y) ** 2);
      return dist <= 22; // Повышенный радиус тапа для мобильных дисплеев
    });

    if (clickedItem) {
      useGameStore.getState().collectItem(clickedItem.id);
      return; // Прерываем клик, чтобы случайно не открыть меню под предметом
    }

    // 1. Если на экране активен призрак постройки башни
    if (state.buildPreview) {
      const p = state.buildPreview;
      const btnRadius = 14;

      const distOk = Math.sqrt((clickX - (p.x + 30)) ** 2 + (clickY - (p.y - 30)) ** 2);
      if (distOk <= btnRadius) {
        useGameStore.getState().confirmPlacement();
        return;
      }

      const distCancel = Math.sqrt((clickX - (p.x - 30)) ** 2 + (clickY - (p.y - 30)) ** 2);
      if (distCancel <= btnRadius) {
        useGameStore.getState().cancelPlacement();
        return;
      }
    }

    // 2. ПРОВЕРКА: Кликнули ли по уже построенной башне?
    const clickedTower = state.towers.find((t) => {
      const dist = Math.sqrt((clickX - t.x) ** 2 + (clickY - t.y) ** 2);
      return dist <= 25; // Радиус башни 25px (size 50)
    });

    if (clickedTower) {
      useGameStore.getState().selectTowerOnField(clickedTower.id);
      return;
    }

    // 3. Если меню башни открыто и мы кликнули на пустую траву — закрываем его
    if (state.selectedTowerId && !state.selectedTowerType) {
      useGameStore.getState().closeTowerMenu();
      return;
    }

    // Если мы в режиме выбора пушки из магазина и ткнули в траву — двигаем призрак
    if (state.selectedTowerType) {
      buyAndPlaceTower(clickX, clickY);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // 1. Сначала загружаем общие ассеты игры (башни, пули, интерфейс)
    loadAllAssets(() => {
      const currentLvl = useGameStore.getState().currentLevel;

      // 2. Только после этого динамически подгружаем декорации текущего уровня
      loadLevelDecor(currentLvl, () => {

        // Переносим массив декораций из конфига в стейт игры
        useGameStore.setState({
          decorations: LEVELS_CONFIG[currentLvl]?.decorations || []
        });

        // 3. Объявляем игровой цикл рендеринга
        const render = () => {
          const storeState = useGameStore.getState();
          storeState.updateGame();

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Отрисовка окружения
          drawer.drawBackground(ctx, canvas);
          drawer.drawRoad(ctx, storeState.currentLevel);
          drawer.drawDecorations(ctx, storeState.decorations);

          drawer.drawScorches(ctx, storeState.scorches);

          drawer.drawSlimeTrails(ctx, storeState.slimeTrails);

          drawer.drawRocketPad(ctx, storeState.currentLevel);
          drawer.drawFlyingRockets(ctx, storeState.flyingRockets);

          const paths = storeState.roadPaths || [];
          const firstPath = paths[0] || [];
          const cakePoint = firstPath[firstPath.length - 1] || { x: 800, y: 250 };

          const graph = gameHelpers.calculateNetworkGraph(storeState.towers, cakePoint, storeState.towerTypes);

          const baseNode = graph.find(n => n.id === 'base');
          const baseConnectionsCount = baseNode ? baseNode.connectedIds.length : 0;

          drawer.drawNetworkLines(ctx, graph, storeState.buildPreview);

          // 🔥 ДОБАВЛЯЕМ СЮДА: Отрисовка значков Wi-Fi и лимитов линий
          drawer.drawNetworkConnectionsHud(ctx, graph);

          drawer.drawCake(ctx, cakePoint, storeState.cakeHp, storeState.maxCakeHp, assets, baseConnectionsCount);

          drawer.drawBaseShield(ctx, cakePoint, storeState.shieldFlashTimer);

          // Оставшаяся отрисовка игровых элементов
          drawer.drawTowers(ctx, storeState.towers);
          drawer.drawBuildPreview(ctx, storeState.buildPreview, assets);
          drawer.drawDroppedItems(ctx, storeState.droppedItems);
          drawer.drawParticles(ctx, storeState.particles);

          drawer.drawEnemies(ctx, storeState.enemies, storeState.roadPaths);
          drawer.drawBullets(ctx, storeState.bullets);
          drawer.drawExplosions(ctx, storeState.explosions);
          drawer.drawDamageTexts(ctx, storeState.damageTexts);
          drawer.drawUI(ctx, canvas, storeState.waveActive, storeState.waveTimer, storeState.gameOver);

          if (storeState.levelTransition) {
            drawer.drawLevelTransition(ctx, canvas, storeState.nextIncomingLevel);
          }

          // Циклически запрашиваем следующий кадр анимации
          animationFrameId = requestAnimationFrame(render);
        };

        // Запускаем цикл строго один раз после полной готовности декораций!
        animationFrameId = requestAnimationFrame(render);
      });
    });

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);


  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0px' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        style={{
          border: '1px solid #3e2723',
          borderRadius: '4px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
