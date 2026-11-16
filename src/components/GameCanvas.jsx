import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { preloadAllAssets, assets } from '../utils/assetLoader';
import * as drawer from '../utils/drawer';
import * as gameHelpers from '../store/gameHelpers';
import { LEVELS_CONFIG } from '../store/gameStore';

const FIXED_TIMESTEP = 1000 / 60; // Жёсткий шаг симуляции: 60 тиков в секунду (16.67 мс)

export const GameCanvas = ({ isPaused }) => {
  const canvasRef = useRef(null);
  const mousePosRef = useRef(null);

  const isAimingRocket = useGameStore((state) => state.isAimingRocket);
  const buyAndPlaceTower = useGameStore((state) => state.buyAndPlaceTower);

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    mousePosRef.current = null;
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    mousePosRef.current = { x: clickX, y: clickY };

    const state = useGameStore.getState();

    // --- РЕЖИМ НАВЕДЕНИЯ РАКЕТЫ ---
    if (state.isAimingRocket) {
      let hitRoad = false;

      for (let path of state.roadPaths) {
        if (gameHelpers.checkIsOnRoad(clickX, clickY, path)) {
          hitRoad = true;
          break;
        }
      }

      if (hitRoad) {
        useGameStore.getState().launchRocket(clickX, clickY);
      } else {
        useGameStore.setState({
          damageTexts: [
            ...state.damageTexts,
            {
              id: Math.random(),
              x: clickX,
              y: clickY - 22,
              text: 'ЦЕЛЬ ВНЕ ДОРОГИ',
              color: '#FF5252',
              isAlert: true,
              alpha: 1,
              timer: 110
            }
          ]
        });
      }
      return;
    }

    // ПРОВЕРКА: Тапнули ли по лежащему на земле предмету?
    const clickedItem = state.droppedItems.find((item) => {
      const dist = Math.sqrt((clickX - item.x) ** 2 + (clickY - item.y) ** 2);
      return dist <= 22;
    });

    if (clickedItem) {
      useGameStore.getState().collectItem(clickedItem.id);
      return;
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
      return dist <= 25;
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

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let isCancelled = false;

    // Переменные для независимого от FPS тайминга
    let lastTime = performance.now();
    let accumulator = 0;

    preloadAllAssets().then(() => {
      if (isCancelled) return;

      const currentLvl = useGameStore.getState().currentLevel;
      useGameStore.setState({
        decorations: LEVELS_CONFIG[currentLvl]?.decorations || []
      });

      lastTime = performance.now();

      const render = (now) => {
        const frameTime = now - lastTime;
        lastTime = now;

        // Ограничиваем максимальный скачок времени (100 мс), чтобы при сворачивании вкладки не было рывка
        const clampedFrameTime = Math.min(frameTime, 100);

        if (!isPausedRef.current) {
          accumulator += clampedFrameTime;

          // Выполняем ровно столько логических шагов, сколько прошло реального времени
          while (accumulator >= FIXED_TIMESTEP) {
            useGameStore.getState().updateGame();
            accumulator -= FIXED_TIMESTEP;
          }
        } else {
          accumulator = 0;
        }

        const storeState = useGameStore.getState();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Отрисовка закешированной карты (фон + дорога + декор) одним вызовом
        drawer.drawCachedMap(ctx, canvas, storeState.currentLevel, storeState.decorations);

        drawer.drawScorches(ctx, storeState.scorches);
        drawer.drawSlimeTrails(ctx, storeState.slimeTrails);

        const isSiloSelected = storeState.selectedTowerType === 'silo' || storeState.buildPreview?.type === 'silo';
        drawer.drawRocketPad(ctx, storeState.currentLevel, isSiloSelected);
        drawer.drawFlyingRockets(ctx, storeState.flyingRockets);

        const paths = storeState.roadPaths || [];
        const firstPath = paths[0] || [];
        const cakePoint = firstPath[firstPath.length - 1] || { x: 800, y: 270 };

        const graph = gameHelpers.calculateNetworkGraph(storeState.towers, cakePoint, storeState.towerTypes);
        const baseNode = graph.find(n => n.id === 'base');
        const baseConnectionsCount = baseNode ? baseNode.connectedIds.length : 0;

        drawer.drawNetworkLines(ctx, graph, storeState.buildPreview, storeState.selectedTowerType);
        drawer.drawNetworkConnectionsHud(ctx, graph);
        drawer.drawCake(ctx, cakePoint, storeState.cakeHp, storeState.maxCakeHp, assets, baseConnectionsCount);
        drawer.drawBaseShield(ctx, cakePoint, storeState.shieldFlashTimer);

        drawer.drawTowers(ctx, storeState.towers);
        drawer.drawBuildPreview(ctx, storeState.buildPreview, assets);
        drawer.drawDroppedItems(ctx, storeState.droppedItems);
        drawer.drawParticles(ctx, storeState.particles);

        drawer.drawEnemies(ctx, storeState.enemies, storeState.roadPaths);
        drawer.drawBullets(ctx, storeState.bullets);
        drawer.drawExplosions(ctx, storeState.explosions);
        drawer.drawDamageTexts(ctx, storeState.damageTexts);

        if (storeState.isAimingRocket && mousePosRef.current) {
          let isValidRoad = false;
          for (let path of storeState.roadPaths) {
            if (gameHelpers.checkIsOnRoad(mousePosRef.current.x, mousePosRef.current.y, path)) {
              isValidRoad = true;
              break;
            }
          }

          const silo = storeState.towers.find(t => t.isRocketSilo);
          const blastRadius = silo?.specialization === 'grad' ? Math.round(65 * 1.33) : 65;

          drawer.drawRocketAim(ctx, mousePosRef.current, isValidRoad, blastRadius);
        }

        drawer.drawUI(ctx, canvas, storeState.waveActive, storeState.waveTimer, storeState.gameOver);

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
    });

    return () => {
      isCancelled = true;
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          border: '1px solid #3e2723',
          borderRadius: '3px 0 0 3px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          cursor: isAimingRocket ? 'none' : 'pointer',
          display: 'block'
        }}
      />
    </div>
  );
};
