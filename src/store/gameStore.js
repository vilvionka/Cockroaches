import { create } from 'zustand';
import * as helpers from './gameHelpers';
import { loadLevelDecor } from '../utils/assetLoader';


export const LEVELS_CONFIG = {
  1: {
    // Ваша сетка плиток (визуал)
    tileMap: [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null, null, null, null],
      [null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, { type: 'corner', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }],
      [null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, { type: 'straight', angle: 90 }, null, null, null],
      [null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, { type: 'straight', angle: 90 }, null, null, null],
      [null, null, null, null, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ],
    // Жесткие рельсы для жуков (физика), проложенные точно по центрам ваших плиток:
    paths: [
      [
        { x: 0, y: 210 },
        { x: 330, y: 210 },
        { x: 330, y: 450 },
        { x: 570, y: 450 },
        { x: 570, y: 270 },
        { x: 800, y: 270 }  // ФИНИШ! Тут стоит Главная База
      ]
    ],
    maxWaves: 6,
    basePoint: { x: 800, y: 270 }, // База закреплена на финальной точке
    rocketPad: { x: 650, y: 150 },
    decorations: [
      { id: 'dec_1', type: 'obj1', x: 400, y: 120, size: 100 },
      { id: 'dec_2', type: 'obj2', x: 150, y: 400, size: 120 }
    ]
  },
  2: {
    // Сетка плиток 10x13 (60x60 px каждая) для двух дорог, сходящихся у Базы
    tileMap: [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      // Верхний вход (row 2 -> y = 150)
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null, null, null, null, null],
      [null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null, null, null, null, null],
      // Слияние верхней и нижней дорог на Т-перекрестке (col 9, row 4 -> x = 570, y = 270) и выход к Базе
      [null, null, null, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 't_junction', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }],
      [null, null, null, null, null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null],
      // Нижняя дорога поднимается к перекрестку
      [null, null, null, null, null, null, { type: 'corner', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null, null],
      // Нижний вход (row 7 -> y = 450)
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ],

    // Физические рельсы строго по центрам плиток для обеих дорог
    paths: [
      // Путь 0: Верхняя дорога
      [
        { x: 0, y: 150 },
        { x: 270, y: 150 },
        { x: 270, y: 270 },
        { x: 570, y: 270 },
        { x: 800, y: 270 }
      ],
      // Путь 1: Нижняя дорога
      [
        { x: 0, y: 450 },
        { x: 390, y: 450 },
        { x: 390, y: 390 },
        { x: 570, y: 390 },
        { x: 570, y: 270 },
        { x: 800, y: 270 }
      ]
    ],

    maxWaves: 7,
    basePoint: { x: 800, y: 270 },
    rocketPad: { x: 660, y: 120 }, // Площадка для ракеты в свободном верхнем правом углу
    decorations: [
      { id: 'dec_2_1', type: 'obj1', x: 460, y: 120, size: 100 },
      { id: 'dec_2_2', type: 'obj2', x: 160, y: 300, size: 110 }
    ]
  }
};





export const useGameStore = create((set, get) => ({
  // Системные переменные уровней
  currentLevel: 1,
  levelWaveNumber: 0, // Волна конкретно на этом уровне (1, 2, 3...)
  waveNumber: 0,      // Общая сквозная волна игры для масштабирования силы жуков
  levelTransition: false,
  transitionDelayTimer: 0,
  damageTexts: [],
  selectedTowerId: null,
  shieldFlashTimer: 0,
  particles: [],
  activeTab: 'weapons', // 'weapons' | 'network' | 'rockets'
  setActiveTab: (tab) => set({ activeTab: tab }),
  isAimingRocket: false,    // Находится ли игрок в режиме выбора точки удара
  flyingRockets: [],        // Массив летящих в данный момент ракет



  // Массив путей для текущей карты
  // Внутри useGameStore (где объявляются дефолтные переменные) верните старую добрую строку:
  roadPaths: LEVELS_CONFIG[1].paths,
  decorations: LEVELS_CONFIG[1].decorations ? JSON.parse(JSON.stringify(LEVELS_CONFIG[1].decorations)) : [],


  enemies: [],
  spawnQueue: [],
  spawnTimer: 0,
  cakeHp: 100,
  maxCakeHp: 100,
  waveTimer: 900,
  score: 0,
  waveActive: false,
  gameOver: false,
  gold: 150, // Дадим чуть больше золота на старте
  towers: [],
  bullets: [],
  explosions: [],
  selectedTowerType: null,
  activeHoleIndex: null,
  buildPreview: null,
  boostsInventory: { damage: 0, fireRate: 0, range: 0 }, // Инвентарь накопленных бустов
  droppedItems: [], // Бусты и монеты, лежащие на земле
  scorches: [],
  slimeTrails: [],
  killedStats: {
    normal: 0,
    ant: 0,
    beetle: 0,
    rhino: 0,
    fly: 0,
    boss: 0
  },
  isUserPaused: false,


  // Обновите объект enemyTypes, прописав цвета крови (bloodColor):
  // Внутри объекта enemyTypes в gameStore.js:
  enemyTypes: {
    normal: {
      type: 'normal',
      speed: 0.5,
      hp: 550,
      maxHp: 550,
      size: 50,
      damage: 12,
      reward: 25,
      scoreReward: 10, // Обычный таракан — базовые 10 очков
      spritePath: './cockroach.png',
      bloodColor: '#ff1420',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1376,  // 👈 ПОМЕНЯТЬ ТУТ
      imgHeight: 768,  // 👈 ПОМЕНЯТЬ ТУТ
      animSpeed: 5,
      missChance: 0.03,      // 3% уклонения (кроме frost)
      ignoreFrostMiss: true,
      name: 'Ксено-скаут',
      description: 'Базовый разведчик. Имеет 3% шанс уклониться от любых пуль, кроме ледяных снарядов Заморозки.'
    },
    ant: {
      type: 'ant',
      speed: 1.1,
      hp: 350,
      maxHp: 350,
      size: 35,
      damage: 5,
      reward: 15,
      scoreReward: 5, // Мелкий быстрый муравей — 5 очков
      spritePath: './ant.png',
      bloodColor: '#0084ff',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1365,  // 👈 ПОМЕНЯТЬ ТУТ
      imgHeight: 768,  // 👈 ПОМЕНЯТЬ ТУТ
      animSpeed: 3,
      missChance: 0.05,
      name: 'Крио-стридер',
      description: 'Быстрый и мелкий. Передвигается группами, шанс уклонения от всех видов пуль — 5%.'
    },
    beetle: {
      type: 'beetle',
      speed: 0.8,
      hp: 1300,
      maxHp: 1300,
      size: 55,
      damage: 20,
      reward: 50,
      scoreReward: 25, // Толстый жук — 25 очков
      spritePath: './beetle.png',
      bloodColor: '#99ff00',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1365,  // 👈 ПОМЕНЯТЬ ТУТ
      imgHeight: 768,  // 👈 ПОМЕНЯТЬ ТУТ
      animSpeed: 8,
      frameOffsetsX: [1.5, 0.5, 0, -1.5, 1.5, 0.5, 0, -1.5],
      missChance: 0.07,
      name: 'Золотой панцирник',
      description: 'Тяжелый панцирь с большим запасом здоровья. Шанс уклонения от выстрелов — 7%.'
    },
    rhino: {
      type: 'rhino',
      speed: 1.2,
      hp: 1600,
      maxHp: 1600,
      size: 60,
      damage: 25,
      reward: 60,
      scoreReward: 45, // Бронированный жук-олень — 45 очков
      spritePath: './rhino.png',
      bloodColor: '#ff0000',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1365,  // 👈 ПОМЕНЯТЬ ТУТ
      imgHeight: 768,  // 👈 ПОМЕНЯТЬ ТУТ
      animSpeed: 5,
      missChance: 0,
      name: 'Джаггернаут',
      description: 'Тяжелая броня полностью блокирует обычные пули Пулемета. Пробивается только ББ-патронами, Бомбардой, Заморозкой или ракетами.'
    },
    fly: {
      type: 'fly',
      speed: 1.3,
      hp: 1200,
      maxHp: 1200,
      size: 50,
      damage: 10,
      reward: 20,
      scoreReward: 15, // Шустрая муха — 15 очков
      spritePath: './fly.png',
      bloodColor: '#00e5ff',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1365,  // 👈 ПОМЕНЯТЬ ТУТ
      imgHeight: 768,  // 👈 ПОМЕНЯТЬ ТУТ
      animSpeed: 3,
      frameOffsetsX: [-2, -0.5, 0.5, 2, -2, -0.5, 0.5, 2],
      missChance: 0.06,      // 6% от всех пуль
      splashResist: 0.5,
      name: 'Пиро-рейнджер',
      description: 'Высокая скорость движения. Шанс уклонения 6%, а также получает на 50% меньше урона от взрывов Бомбарды и ракет.'
    },
    boss: {
      type: 'boss',
      speed: 0.6,      // Босс движется медленнее и величественнее
      hp: 800,          // Будет пересчитано в 4 раза больше базового вида в генераторе волн
      maxHp: 800,
      size: 78,         // Матка должна быть огромной визуально!
      damage: 40,       // Огромный урон базе, если дойдет
      reward: 150,      // Щедрая награда в кредитах
      scoreReward: 150, // Много очков за победу
      spritePath: '',   // Будет динамически подставляться в генераторе
      bloodColor: '#39ff14',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1671,
      imgHeight: 941,
      animSpeed: 5,
      missChance: 0.08,
      name: 'Королева Улья',
      description: 'Огромный босс волны. Шанс уклонения от пуль — 8%. После уничтожения выпускает двух быстрых жуков своего вида.'
    }
  },




  towerTypes: {
    gun: {
      type: 'gun',
      name: 'Пулемет',
      cost: 100,
      range: 95,
      damage: 75, // Среднее для совместимости
      minDamage: 70,
      maxDamage: 80,
      critChance: 0.08,     // 8% на 1 уровне
      critMultiplier: 1.5,  // 150% урона на 1 уровне
      fireRate: 20,
      size: 50,
      bulletType: 'single',
      unlockWave: 1,
      rotationSpeed: 0.05,
      isAntenna: false
    },
    bomb: {
      type: 'bomb',
      name: 'Бомбарда',
      cost: 200,
      range: 85,
      damage: 205,
      minDamage: 195,
      maxDamage: 215,
      critChance: 0.08,     // 8% на 1 уровне
      critMultiplier: 1.5,  // 150% урона на 1 уровне
      fireRate: 45,
      size: 50,
      bulletType: 'splash',
      splashRadius: 60,
      splashDamage: 15,
      unlockWave: 2,
      rotationSpeed: 0.02,
      isAntenna: false
    },
    frost: { type: 'frost', name: 'Заморозка', cost: 300, range: 70, damage: 3, fireRate: 30, size: 50, bulletType: 'frost', slowDuration: 120, slowFactor: 0.5, unlockWave: 3, rotationSpeed: 0.035, isAntenna: false },

    silo: {
      type: 'silo',
      name: 'Ракетница',
      cost: 500,
      range: 9999,
      size: 60,
      isRocketSilo: true,
      unlockWave: 1
    },
    // ТРИ ОТДЕЛЬНЫЕ АНТЕННЫ С РАЗНЫМ КОЛИЧЕСТВОМ ПОДКЛЮЧЕНИЙ
    an3: { type: 'an3', name: 'АН-3', cost: 120, range: 250, size: 50, isAntenna: true, maxConnections: 3, unlockWave: 1 },
    an4: { type: 'an4', name: 'АН-4', cost: 180, range: 280, size: 50, isAntenna: true, maxConnections: 4, unlockWave: 2 },
    an5: { type: 'an5', name: 'АН-5', cost: 250, range: 310, size: 50, isAntenna: true, maxConnections: 5, unlockWave: 3 }
  },

  togglePause: () => set((state) => {
    if (state.gameOver || state.levelTransition) return {};
    const nextPaused = !state.isUserPaused;

    // Сообщаем Яндекс Играм о паузе или возобновлении геймплея
    if (nextPaused) {
      window.ysdk?.features?.GameplayAPI?.stop();
    } else {
      window.ysdk?.features?.GameplayAPI?.start();
    }

    return { isUserPaused: nextPaused };
  }),



  // Автоматический генератор путей по матрице плиток
  generatePathsFromMap: (tileMap) => {
    const tileSize = 60;
    const path = [];

    // 1. Ищем стартовую плитку на левом краю (col = 0)
    let currentCoum = 0;
    let currentRow = tileMap.findIndex(row => row[0] !== null);

    if (currentRow === -1) return [[{ x: 30, y: 90 }]]; // Заглушка, если карта пуста

    let prevRow = -1;
    let prevCol = -1;

    // 2. Шагаем по перекресткам и прямым, пока не упремся в тупик или край карты
    while (currentRow >= 0 && currentRow < tileMap.length && currentCoum >= 0 && currentCoum < tileMap[0].length) {
      const tile = tileMap[currentRow][currentCoum];
      if (!tile) break;

      // Считаем центр текущей плитки в пикселях
      path.push({
        x: currentCoum * tileSize + tileSize / 2,
        y: currentRow * tileSize + tileSize / 2
      });

      // Смотрим доступных соседей (куда ведет дорога), исключая клетку, откуда пришли
      let nextR = -1, nextC = -1;

      // Проверяем соседа справа
      if (currentCoum + 1 < tileMap[0].length && tileMap[currentRow][currentCoum + 1] && (currentCoum + 1 !== prevCol)) {
        nextR = currentRow; nextC = currentCoum + 1;
      }
      // Проверяем соседа снизу
      else if (currentRow + 1 < tileMap.length && tileMap[currentRow + 1][currentCoum] && (currentRow + 1 !== prevRow)) {
        nextR = currentRow + 1; nextC = currentCoum;
      }
      // Проверяем соседа сверху
      else if (currentRow - 1 >= 0 && tileMap[currentRow - 1][currentCoum] && (currentRow - 1 !== prevRow)) {
        nextR = currentRow - 1; nextC = currentCoum;
      }
      // Проверяем соседа слева
      else if (currentCoum - 1 >= 0 && tileMap[currentRow][currentCoum - 1] && (currentCoum - 1 !== prevCol)) {
        nextR = currentRow; nextC = currentCoum - 1;
      }

      prevRow = currentRow;
      prevCol = currentCoum;
      currentRow = nextR;
      currentCoum = nextC;
    }

    return [path]; // Возвращаем массив путей
  },


  selectTowerToBuild: (type) => set((state) => {
    // Повторный клик по уже выбранной башне, антенне или шахте — отменяет выбор и убирает призрака
    if (state.selectedTowerType === type) {
      return {
        selectedTowerType: null,
        buildPreview: null,
        isAimingRocket: false
      };
    }

    // Если выбрали Ракетную Шахту — сразу показываем её превью на стартовой площадке
    if (type === 'silo') {
      const hasSilo = state.towers.some(t => t.isRocketSilo);
      if (hasSilo) return { selectedTowerType: null, buildPreview: null, isAimingRocket: false };

      const towerData = state.towerTypes[type];
      const pad = LEVELS_CONFIG[state.currentLevel]?.rocketPad;
      if (!pad || !towerData) return { selectedTowerType: type, isAimingRocket: false };

      return {
        selectedTowerType: type,
        selectedTowerId: null,
        isAimingRocket: false,
        buildPreview: {
          type: type,
          x: pad.x,
          y: pad.y,
          cost: towerData.cost,
          range: towerData.range,
          size: towerData.size
        }
      };
    }

    // Для остальных башен и антенн — обычный выбор
    return {
      selectedTowerType: type,
      selectedTowerId: null,
      buildPreview: null,
      isAimingRocket: false
    };
  }),



  buyAndPlaceTower: (clickX, clickY) => set((state) => {
    const { selectedTowerType, towerTypes, gold, roadPaths } = state;
    if (!selectedTowerType) return {};

    const towerData = towerTypes[selectedTowerType];
    if (gold < towerData.cost) return {};


    // ЕСЛИ СТРОИМ РАКЕТУ
    if (towerData.isRocketSilo) {
      // Берём towers и currentLevel строго из state
      const hasSilo = state.towers.some(t => t.isRocketSilo);
      if (hasSilo) return {};

      const pad = LEVELS_CONFIG[state.currentLevel].rocketPad;
      return {
        buildPreview: {
          type: selectedTowerType,
          x: pad.x,
          y: pad.y,
          cost: towerData.cost,
          range: towerData.range,
          size: towerData.size
        }
      };
    }


    let finalX = clickX;
    let finalY = clickY;
    let isNearAnyRoad = false;

    // Рассчитываем координаты примагничивания к дороге
    for (let path of roadPaths) {
      const snapped = helpers.getSnappedPosition(clickX, clickY, path);
      if (snapped.distanceToRoad < 80) {
        finalX = snapped.x;
        finalY = snapped.y;
        isNearAnyRoad = true;
        break;
      }
    }

    if (!isNearAnyRoad) return {};

    // Не строим окончательно, а просто перемещаем или создаем ПРИЗРАКА башни
    return {
      buildPreview: {
        type: selectedTowerType,
        x: finalX,
        y: finalY,
        cost: towerData.cost,
        range: towerData.range,
        size: towerData.size
      }
    };
  }),

  confirmPlacement: () => set((state) => {
    const { buildPreview, towers, gold, towerTypes, roadPaths, currentLevel } = state;
    if (!buildPreview) return {};
    if (gold < buildPreview.cost) return { buildPreview: null, selectedTowerType: null };

    const towerData = towerTypes[buildPreview.type];
    let parentId = null;
    let connectionSource = null;

    // Вспомогательная функция для быстрого пуша всплывающих ошибок
    const pushErrorText = (text) => {
      state.damageTexts.push({
        id: Math.random(),
        x: buildPreview.x,
        y: buildPreview.y - 28,
        text: text,
        color: '#FF5252',
        isAlert: true, // Помечаем, что это системное предупреждение, а не урон
        alpha: 1,
        timer: 150     // 2.5 секунды (150 кадров при 60 FPS)
      });
    };


    // 1. ДЛЯ ВСЕХ, КРОМЕ РАКЕТЫ: Проверяем наличие связи с базой
    if (!towerData.isRocketSilo) {
      const basePoint = LEVELS_CONFIG[currentLevel].basePoint;
      const networkGraph = helpers.calculateNetworkGraph(towers, basePoint, towerTypes);

      // Ищем доступный узел подключения
      connectionSource = helpers.findAvailableConnection(buildPreview.x, buildPreview.y, networkGraph, towerTypes);

      if (!connectionSource) {
        // Дополнительная проверка: есть ли вообще вышка рядом, но просто забита?
        let nodeNearbyButFull = false;
        networkGraph.forEach(node => {
          if (node.isActive && (node.id === 'base' || node.isAntenna)) {
            const dist = Math.sqrt((buildPreview.x - node.x) ** 2 + (buildPreview.y - node.y) ** 2);
            if (dist <= node.range && node.connectedIds.length >= node.maxConnections) {
              nodeNearbyButFull = true;
            }
          }
        });

        if (nodeNearbyButFull) {
          pushErrorText("ЛИМИТ ПОДКЛЮЧЕНИЙ");
        } else {
          pushErrorText("НЕТ СВЯЗИ");
        }
        return {};
      }
      parentId = connectionSource.id;
    }

    // 2. ДЛЯ ВСЕХ, КРОМЕ РАКЕТЫ: Проверки геопозиции (база, дороги, пересечения)
    if (!towerData.isRocketSilo) {
      const paths = roadPaths || [];
      const firstPath = paths[0] || [];
      const cakePoint = firstPath[firstPath.length - 1] || { x: 800, y: 250 };
      const baseSafetyWidth = 85;
      const baseSafetyHeight = 85;

      // Проверка на зону Главной Базы
      if (buildPreview.x >= cakePoint.x - baseSafetyWidth &&
        buildPreview.y >= cakePoint.y - baseSafetyHeight &&
        buildPreview.y <= cakePoint.y + baseSafetyHeight) {
        pushErrorText("БЛИЗКО К БАЗЕ");
        return {};
      }

      // Проверка: Не пытаемся ли поставить прямо НА полотно дороги
      for (let path of roadPaths) {
        if (helpers.checkIsOnRoad(buildPreview.x, buildPreview.y, path)) {
          pushErrorText("НА ДОРОГЕ НЕЛЬЗЯ");
          return {};
        }
      }

      // Проверка: Слишком близко к существующим башням
      const minSpacingBetweenTowers = 53;
      for (let i = 0; i < towers.length; i++) {
        const existingTower = towers[i];
        const dist = Math.sqrt((buildPreview.x - existingTower.x) ** 2 + (buildPreview.y - existingTower.y) ** 2);
        if (dist < minSpacingBetweenTowers) {
          pushErrorText("РЯДОМ ЕСТЬ БАШНЯ");
          return {};
        }
      }
    }

    // Расчет угла к дороге
    let initialAngle = 0;
    let minDistanceToRoad = Infinity;
    for (let path of roadPaths) {
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i]; const p2 = path[i + 1];
        const A = buildPreview.x - p1.x; const B = buildPreview.y - p1.y;
        const C = p2.x - p1.x; const D = p2.y - p1.y;
        const dot = A * C + B * D; const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        let cx = param < 0 ? p1.x : param > 1 ? p2.x : p1.x + param * C;
        let cy = param < 0 ? p1.y : param > 1 ? p2.y : p1.y + param * D;
        const dist = Math.sqrt((buildPreview.x - cx) ** 2 + (buildPreview.y - cy) ** 2);
        if (dist < minDistanceToRoad) {
          minDistanceToRoad = dist;
          initialAngle = Math.atan2(cy - buildPreview.y, cx - buildPreview.x);
        }
      }
    }

    const newTower = {
      ...towerData,
      id: Math.random(),
      x: buildPreview.x,
      y: buildPreview.y,
      cooldown: 0,
      angle: initialAngle,
      level: 1,
      underConstruction: true,
      constructionType: 'build',
      constructionTimer: 180,
      maxConstructionTime: 180,
      parentId: connectionSource ? connectionSource.id : null,
      isAntenna: towerData.isAntenna,
      isRocketSilo: towerData.isRocketSilo || false,
    };

    return {
      towers: [...towers, newTower],
      gold: gold - buildPreview.cost,
      buildPreview: null,
      selectedTowerType: null
    };
  }),




  cancelPlacement: () => set({
    buildPreview: null,
    selectedTowerType: null
  }),



  // 3. Добавь новые экшены прямо под cancelPlacement:
  selectTowerOnField: (id) => set({
    selectedTowerId: id,
    selectedTowerType: null, // Сбрасываем режим постройки, если выбрали готовую башню
    buildPreview: null
  }),

  upgradeTower: () => set((state) => {
    const { selectedTowerId, towers, gold } = state;
    if (!selectedTowerId) return {};

    const targetTower = towers.find(t => t.id === selectedTowerId);
    if (!targetTower) return {};
    if (targetTower.isAntenna || targetTower.underConstruction) return {};

    const currentLevel = targetTower.level || 1;
    if (currentLevel >= 4) return {};

    // 50% от базовой стоимости на 1-м апгрейде, далее удвоение каждый уровень
    const upgradeCost = Math.round((targetTower.cost * 0.5) * Math.pow(2, currentLevel - 1));
    if (gold < upgradeCost) return {};

    const baseUpgradeFrames = 600;
    const progressiveFrames = Math.round(baseUpgradeFrames * Math.pow(1.2, currentLevel - 1));

    const updatedTowers = towers.map((t) => {
      if (t.id === selectedTowerId) {
        return {
          ...t,
          underConstruction: true,
          constructionType: 'upgrade',
          constructionTimer: progressiveFrames,
          maxConstructionTime: progressiveFrames
        };
      }
      return t;
    });

    return { towers: updatedTowers, gold: gold - upgradeCost };
  }),



  specializeTower: (specType) => set((state) => {
    const { selectedTowerId, towers, gold } = state;
    if (!selectedTowerId) return {};

    const targetTower = towers.find(t => t.id === selectedTowerId);
    if (!targetTower) return {};

    // На 4-м уровне (currentLevel = 4) формула даст: cost * 0.5 * 2^3 = cost * 4 (например, 800 для башни за 200)
    const specCost = Math.round((targetTower.cost * 0.5) * Math.pow(2, 3));
    if (gold < specCost || targetTower.level !== 4 || targetTower.underConstruction) return {};

    const updatedTowers = towers.map((t) => {
      if (t.id === selectedTowerId) {
        let specModifiers = { level: 5, specialization: specType };

        if (specType === 'nuke') {
          specModifiers.name = 'МБР "Ядерный Удар"';
        } else if (specType === 'grad') {
          specModifiers.name = 'РСЗО "Град"';
        }

        if (t.critChance !== undefined) {
          specModifiers.critChance = +(t.critChance + 0.01).toFixed(2); // Станет 0.12 (12%)
          specModifiers.critMultiplier = +(t.critMultiplier + 0.2).toFixed(2); // Станет 2.3 (230%)
        }

        // Настройка параметров в зависимости от выбора игрока
        if (specType === 'ap_ammo') { // Бронебойные пули
          specModifiers.name = 'Пулемет (БП)';
          specModifiers.damage = Math.round(t.damage * 1.3);
          specModifiers.minDamage = Math.round(t.minDamage * 1.3);
          specModifiers.maxDamage = Math.round(t.maxDamage * 1.3);
        } else if (specType === 'fire_ammo') { // Зажигательные пули
          specModifiers.name = 'Пулемет (ЗП)';
          specModifiers.bulletType = 'fire';
        } else if (specType === 'big_splash') { // Бомбарда: урон по площади
          specModifiers.name = 'Бомбарда (АОЕ)';
          specModifiers.splashRadius = Math.round(t.splashRadius * 1.6);
          specModifiers.splashDamage = Math.round(t.splashDamage * 1.5);
        } else if (specType === 'heavy_target') { // Бомбарда: урон по цели
          specModifiers.name = 'Бомбарда (Сигма)';
          specModifiers.damage = Math.round(t.damage * 2.2);
          specModifiers.minDamage = Math.round(t.minDamage * 2.2);
          specModifiers.maxDamage = Math.round(t.maxDamage * 2.2);
        } else if (specType === 'frost_aoe') { // Заморозка: крио-взрыв
          specModifiers.name = 'Крио-Бластер';
        } else if (specType === 'frost_perma') { // Заморозка: длительный контроль
          specModifiers.name = 'Замораживатель Икс';
          specModifiers.slowDuration = Math.round(t.slowDuration * 1.8);
          specModifiers.slowFactor = 0.35; // Замедляет еще сильнее (до 35% скорости)
        }

        return {
          ...t,
          ...specModifiers,
          underConstruction: true,
          constructionType: 'upgrade',
          constructionTimer: 420, // 7 секунд на установку спец-модификации
          maxConstructionTime: 420
        };
      }
      return t;
    });

    return {
      towers: updatedTowers,
      gold: gold - specCost
    };
  }),



  sellTower: () => set((state) => {
    const { selectedTowerId, towers, gold } = state;
    if (!selectedTowerId) return {};

    const targetTower = towers.find(t => t.id === selectedTowerId);
    if (!targetTower) return {};

    // Возвращаем игроку 60% от базовой стоимости башни
    const returnGold = Math.round(targetTower.cost * 0.6);
    const filteredTowers = towers.filter(t => t.id !== selectedTowerId);

    return {
      towers: filteredTowers,
      gold: gold + returnGold,
      selectedTowerId: null // Закрываем меню башни, так как она продана
    };
  }),

  closeTowerMenu: () => set({ selectedTowerId: null }),


  // 3. Добавь новые экшены прямо под closeTowerMenu:
  collectItem: (itemId) => set((state) => {
    const item = state.droppedItems.find(i => i.id === itemId);
    if (!item) return {};

    const newInventory = { ...state.boostsInventory };
    let newGold = state.gold;

    if (item.boostType === 'gold') {
      newGold += item.value;
      // Создаем летящий текст, что мы подобрали золото
      state.damageTexts.push({
        id: Math.random(), x: item.x, y: item.y, text: `+${item.value} 💰`, color: '#FFD700', alpha: 1, timer: 40
      });
    } else {
      newInventory[item.boostType] += 1;
      const label = item.boostType === 'damage' ? 'УРОН' : item.boostType === 'fireRate' ? 'СКОРОСТЬ' : 'ДАЛЬНОСТЬ';
      state.damageTexts.push({
        id: Math.random(), x: item.x, y: item.y, text: `+1 ${label} ⚡`, color: '#00E5FF', alpha: 1, timer: 40
      });
    }

    return {
      gold: newGold,
      boostsInventory: newInventory,
      droppedItems: state.droppedItems.filter(i => i.id !== itemId)
    };
  }),

  applyBoostToTower: (boostType) => set((state) => {
    const { selectedTowerId, towers, boostsInventory } = state;
    if (!selectedTowerId || boostsInventory[boostType] <= 0) return {};

    const updatedTowers = towers.map((t) => {
      if (t.id === selectedTowerId) {
        // Инициализируем объект активных бустов, если его нет
        const activeBoosts = t.activeBoosts ? { ...t.activeBoosts } : {};

        // Задаем таймер на 10 секунд (10 * 60 кадров = 600 кадров)
        activeBoosts[boostType] = 600;

        return { ...t, activeBoosts };
      }
      return t;
    });

    const newInventory = { ...boostsInventory };
    newInventory[boostType] -= 1;

    return {
      towers: updatedTowers,
      boostsInventory: newInventory
    };
  }),


  nextLevel: () => set((state) => {
    const nextLvl = state.nextIncomingLevel;

    if (!LEVELS_CONFIG[nextLvl]) {
      alert("ПОЗДРАВЛЯЕМ! ВЫ ПРОШЛИ ВСЮ ИГРУ!");
      return get().restartGame();
    }

    // Подгружаем декорации для нового уровня
    loadLevelDecor(nextLvl);

    const calculatedGold = Math.min(600, nextLvl * 150);
    const healedHp = Math.min(state.maxCakeHp || 100, state.cakeHp + 25);

    return {
      currentLevel: nextLvl,
      levelWaveNumber: 0,
      roadPaths: LEVELS_CONFIG[nextLvl].paths, // 👈 Берем готовый чистый путь из конфига
      basePoint: LEVELS_CONFIG[nextLvl].basePoint,
      towers: [], // Полная зачистка поля перед новым раундом
      bullets: [],
      enemies: [],
      spawnQueue: [],
      activeHoleIndex: null,
      isUserPaused: false,
      waveActive: false,
      waveTimer: 900, // 15 секунд на развертывание
      levelTransition: false,
      transitionDelayTimer: 0,
      slimeTrails: [],
      droppedItems: [], particles: [], flyingRockets: [],
      scorches: [],
      gold: calculatedGold, // Сбрасываем и начисляем по новой формуле
      decorations: LEVELS_CONFIG[nextLvl].decorations ? JSON.parse(JSON.stringify(LEVELS_CONFIG[nextLvl].decorations)) : [],
      cakeHp: healedHp       // Записываем подлеченный торт
    };
  }),


  startWave: () => set((state) => {
    if (state.waveActive || state.gameOver) return {};

    const nextWaveNumber = state.waveNumber + 1;
    const nextLevelWaveNumber = state.levelWaveNumber + 1;

    const currentLvlConfig = LEVELS_CONFIG[state.currentLevel];
    const { blueprint, holeIndex, holePathIndex } = helpers.generateWaveBlueprint(
      nextWaveNumber,
      state.enemyTypes,
      state.roadPaths,
      state.currentLevel,
      state.levelWaveNumber,
      currentLvlConfig.maxWaves // 👈 Передаем параметр
    );

    const queue = blueprint.map((enemy, index) => {
      const pathIdx = enemy.assignedPathIndex;
      const currentPath = state.roadPaths[pathIdx];
      const startPoint = currentPath[enemy.spawnPointIndex] || currentPath[0];

      return {
        ...enemy,
        id: Math.random() + index,
        x: startPoint.x,
        y: startPoint.y,
        currentPointIndex: enemy.spawnPointIndex,
        currentFrame: 0,
        tickCounter: 0
      };
    });

    // --- МЕХАНИКА СБРОСА СТВОЛОВ К ДОРОГЕ ПЕРЕД ВОЛНОЙ ---
    const resetTowers = state.towers.map((tower) => {
      let initialAngle = tower.angle; // дефолт, если что-то пойдет не так
      let minDistanceToRoad = Infinity;

      // Ищем ближайший отрезок дороги для КОНКРЕТНОЙ башни
      for (let path of state.roadPaths) {
        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i + 1];

          // Находим проекцию точки башни на отрезок дороги
          const A = tower.x - p1.x;
          const B = tower.y - p1.y;
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

          const dist = Math.sqrt((tower.x - closestRoadX) ** 2 + (tower.y - closestRoadY) ** 2);

          if (dist < minDistanceToRoad) {
            minDistanceToRoad = dist;
            // Рассчитываем чистый угол направления дула на дорогу
            initialAngle = Math.atan2(closestRoadY - tower.y, closestRoadX - tower.x);
          }
        }
      }

      return {
        ...tower,
        angle: initialAngle, // Возвращаем ствол в сторону дороги
        targetEnemyId: null  // Сбрасываем фиксацию старых целей, чтобы не косило
      };
    });

    let initialExplosions = []; // Создаем стартовый массив взрывов для этой волны

    if (holeIndex !== null) {
      const currentPath = state.roadPaths[holePathIndex || 0];
      const holePoint = currentPath[holeIndex];

      if (holePoint) {
        initialExplosions.push({
          id: 'road_hole_effect',   // Фиксированный ID, чтобы дыра была в одном экземпляре
          x: holePoint.x,
          y: holePoint.y,
          type: 'hole_spawn',       // Начинаем строго со спрайта ЗАРОЖДЕНИЯ (8 кадров)
          angle: 0,
          currentFrame: 0,
          tickCounter: 0,
          cols: 4,                  // Сетка 4x2 по вашей картинке
          rows: 2,
          totalFrames: 8,
          animSpeed: 6,             // Скорость смены кадров зарождения
          size: 75                  // Диаметр дыры на дороге
        });
      }
    }

    return {
      waveNumber: nextWaveNumber,
      levelWaveNumber: nextLevelWaveNumber,
      spawnQueue: queue,
      enemies: [],
      towers: resetTowers, // Записываем обновленные башни в стейт
      spawnTimer: 0,
      waveTimer: 0,
      waveActive: true,
      explosions: initialExplosions,
      activeHoleIndex: holeIndex,
      activeHolePathIndex: holePathIndex
    };
  }),


  restartGame: () => set({
    currentLevel: 1,
    levelWaveNumber: 0,
    waveNumber: 0,
    roadPaths: LEVELS_CONFIG[1].paths,
    enemies: [],
    spawnQueue: [],
    spawnTimer: 0,
    cakeHp: 100,
    waveTimer: 900,
    waveActive: false,
    gameOver: false,
    score: 0,
    isUserPaused: false,
    killedStats: { normal: 0, ant: 0, beetle: 0, rhino: 0, fly: 0, boss: 0 },
    scorches: [],
    gold: 150,
    towers: [],
    bullets: [],
    explosions: [],
    damageTexts: [],
    slimeTrails: [],
    particles: [],                                         // Очищаем кровь, гильзы и вспышки
    droppedItems: [],                                      // Убираем выпавшие монеты и бусты с дороги
    boostsInventory: { damage: 0, fireRate: 0, range: 0 }, // Обнуляем инвентарь бустов
    flyingRockets: [],                                     // Убираем летящие ракеты
    isAimingRocket: false,                                 // Сбрасываем прицел ракеты
    shieldFlashTimer: 0,
    activeHoleIndex: null,
    levelTransition: false,
    transitionDelayTimer: 0,
    nextIncomingLevel: 2,
    buildPreview: null,
    selectedTowerType: null,
    selectedTowerId: null,
    decorations: LEVELS_CONFIG[1].decorations ? JSON.parse(JSON.stringify(LEVELS_CONFIG[1].decorations)) : []
  }),


  updateGame: () => set((state) => {
    if (state.gameOver || state.levelTransition || state.isUserPaused) return {};

    const spawnData = helpers.handleSpawning(state);

    // Переменная, которая будет хранить башни с учетом возможного разворота к дороге
    let currentTowersState = state.towers;


    let currentScore = state.score;


    if (spawnData.shouldStartWave && !state.waveActive) {
      const nextWaveNumber = state.waveNumber + 1;
      const nextLevelWaveNumber = state.levelWaveNumber + 1;
      const currentLvlConfig = LEVELS_CONFIG[state.currentLevel];
      const { blueprint, holeIndex, holePathIndex } = helpers.generateWaveBlueprint(
        nextWaveNumber,
        state.enemyTypes,
        state.roadPaths,
        state.currentLevel,
        state.levelWaveNumber,
        currentLvlConfig.maxWaves // 👈 Передаем параметр
      );

      spawnData.spawnQueue = blueprint.map((enemy, index) => {
        const pathIdx = enemy.assignedPathIndex;
        const currentPath = state.roadPaths[pathIdx];
        const startPoint = currentPath[enemy.spawnPointIndex] || currentPath[0];
        return {
          ...enemy,
          id: Math.random() + index,
          x: startPoint.x,
          y: startPoint.y,
          currentPointIndex: enemy.spawnPointIndex,
          currentFrame: 0,
          tickCounter: 0
        };
      });

      // --- ИСПРАВЛЕННЫЙ СБРОС СТВОЛОВ ПО ТАЙМЕРУ ---
      currentTowersState = state.towers.map((tower) => {
        let initialAngle = tower.angle;
        let minDistanceToRoad = Infinity;

        for (let path of state.roadPaths) {
          for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i]; const p2 = path[i + 1];
            const A = tower.x - p1.x; const B = tower.y - p1.y;
            const C = p2.x - p1.x; const D = p2.y - p1.y;
            const dot = A * C + B * D; const lenSq = C * C + D * D;
            let param = lenSq !== 0 ? dot / lenSq : -1;
            let cx = param < 0 ? p1.x : param > 1 ? p2.x : p1.x + param * C;
            let cy = param < 0 ? p1.y : param > 1 ? p2.y : p1.y + param * D;
            const dist = Math.sqrt((tower.x - cx) ** 2 + (tower.y - cy) ** 2);
            if (dist < minDistanceToRoad) {
              minDistanceToRoad = dist;
              initialAngle = Math.atan2(cy - tower.y, cx - tower.x);
            }
          }
        }
        return { ...tower, angle: initialAngle, targetEnemyId: null };
      });

      spawnData.waveTimer = 0;
      spawnData.waveActive = true;
      state.waveNumber = nextWaveNumber;
      state.levelWaveNumber = nextLevelWaveNumber;
      state.activeHoleIndex = holeIndex;
      state.activeHolePathIndex = holePathIndex;

      let autoExplosions = [];
      if (holeIndex !== null) {
        const currentPath = state.roadPaths[holePathIndex || 0];
        const holePoint = currentPath[holeIndex];
        if (holePoint) {
          autoExplosions.push({
            id: 'road_hole_effect',
            x: holePoint.x,
            y: holePoint.y,
            type: 'hole_spawn', // Снова стартуем с зарождения
            angle: 0, currentFrame: 0, tickCounter: 0, cols: 4, rows: 2, totalFrames: 8, animSpeed: 6, size: 75
          });
        }
      }
      spawnData.explosions = autoExplosions; // 
    }

    let currentEnemies = spawnData.enemies;
    const movementData = helpers.updateEnemiesMovement(currentEnemies, state.roadPaths, state.cakeHp);

    // Применяем такт обновления строительства и бустов к ПРАВИЛЬНОМУ массиву башен
    const nextTowers = currentTowersState.map((t) => {
      let tower = { ...t };

      if (tower.isRocketSilo && !tower.underConstruction) {
        if (tower.ammoReady === undefined) tower.ammoReady = 0;
        if (tower.chargeTimer === undefined) tower.chargeTimer = 1500;

        if (tower.ammoReady < 1) {
          tower.chargeTimer -= 1;
          if (tower.chargeTimer <= 0) {
            tower.ammoReady = 1;
            tower.chargeTimer = 0;
          }
        }
        return tower;
      }

      if (tower.underConstruction) {
        tower.constructionTimer -= 1;

        if (tower.constructionTimer <= 0) {
          tower.underConstruction = false;

          if (tower.constructionType === 'upgrade') {
            const nextLvl = tower.level + 1;
            const damageFactor = Math.max(1.10, 1.25 - (nextLvl * 0.015));
            const rangeFactor = nextLvl > 6 ? 1.0 : Math.max(1.02, 1.05 - (nextLvl * 0.005));

            tower.level = nextLvl;
            tower.damage = Math.round(tower.damage * damageFactor);
            if (tower.minDamage !== undefined) {
              tower.minDamage = Math.round(tower.minDamage * damageFactor);
              tower.maxDamage = Math.round(tower.maxDamage * damageFactor);
            }
            if (tower.critChance !== undefined) {
              tower.critChance = +(tower.critChance + 0.01).toFixed(2); // +1% за уровень
              tower.critMultiplier = +(tower.critMultiplier + 0.2).toFixed(2); // +20% за уровень
            }
            tower.range = Math.round(tower.range * rangeFactor);
            if (tower.splashDamage) tower.splashDamage = Math.round(tower.splashDamage * damageFactor);
          }


          delete tower.constructionType;
          delete tower.constructionTimer;
          delete tower.maxConstructionTime;
        }
        return tower;
      }

      if (!tower.activeBoosts) return tower;
      const activeBoosts = { ...tower.activeBoosts };
      let hasChanges = false;
      Object.keys(activeBoosts).forEach((key) => {
        if (activeBoosts[key] > 0) {
          activeBoosts[key] -= 1;
          hasChanges = true;
        }
      });
      return hasChanges ? { ...tower, activeBoosts } : tower;
    });

    // Передаем state.particles четвертым аргументом, чтобы функция знала о существующих частицах
    const towersData = helpers.updateTowersAndShooting(nextTowers, movementData.enemies, state.bullets, state.particles);

    const combatData = helpers.updateBulletsAndCollisions(
      towersData.bullets,
      movementData.enemies,
      state.explosions,
      state.gold,
      state.roadPaths,
      state.damageTexts,
      state.currentLevel,
      state.droppedItems
    );

    let nextScore = state.score;
    const nextKilledStats = { ...state.killedStats };

    movementData.enemies.forEach((enemy) => {
      const stillAlive = combatData.enemies ? combatData.enemies.some(e => e.id === enemy.id && e.hp > 0) : false;

      if (!stillAlive && enemy.hp <= 0 && !enemy.scoreGiven) {
        enemy.scoreGiven = true;

        const points = state.enemyTypes[enemy.type]?.scoreReward || 10;
        nextScore += points;

        // Увеличиваем счетчик убитых жуков этого вида
        if (nextKilledStats[enemy.type] !== undefined) {
          nextKilledStats[enemy.type] += 1;
        }
      }
    });


    const aliveEnemies = combatData.enemies ? combatData.enemies.filter(e => e.hp > 0) : movementData.enemies.filter(e => e.hp > 0);
    let nextExplosions = helpers.updateExplosionsAnimation(combatData.explosions);

    const incomingDamageTexts = combatData.damageTexts || [];
    const combinedDamageTexts = incomingDamageTexts.map((txt) => {
      if (txt.isAlert) {
        // Предупреждение поднимается очень плавно и начинает таять только в последние 40 кадров
        const nextTimer = txt.timer - 1;
        const nextAlpha = nextTimer < 40 ? nextTimer / 40 : 1;
        return { ...txt, y: txt.y - 0.25, alpha: nextAlpha, timer: nextTimer };
      }
      return { ...txt, y: txt.y - 0.8, alpha: txt.alpha - 0.03, timer: txt.timer - 1 };
    }).filter(txt => txt.timer > 0);


    const activeDroppedItems = (state.droppedItems || []).map(item => ({
      ...item,
      timer: item.timer - 1
    })).filter(item => item.timer > 0);





    const finalDroppedItems = [...activeDroppedItems, ...(combatData.newlyDroppedItems || [])];

    // =========================================================================
    // 1. СНАЧАЛА ОБСЧИТЫВАЕМ ВСЕ ЭФФЕКТЫ (ЧАСТИЦЫ, РАКЕТЫ, КРАТЕРЫ, СЛЕДЫ, ЩИТ)
    // =========================================================================

    // --- Частицы (гильзы, вспышки и кровь) ---
    const allActiveParticles = [
      ...(towersData.particles || []),
      ...(state.particles || []).filter(p => p.type === 'blood')
    ];

    const uniqueParticles = Array.from(new Map(allActiveParticles.map(p => [p.id, p])).values());

    const nextParticles = uniqueParticles.map((p) => {
      let vx = p.vx || 0;
      let vy = p.vy || 0;
      let angle = p.angle || 0;

      if (p.type === 'shell') {
        vy += 0.22;
        angle += p.rotSpeed || 0.1;
      }

      return {
        ...p,
        x: p.x + vx,
        y: p.y + vy,
        vx,
        vy,
        angle,
        timer: p.timer - 1,
        alpha: p.timer / p.maxTimer
      };
    }).filter(p => p.timer > 0);

    // --- Летящие тактические ракеты ---
    let postRocketEnemies = [...aliveEnemies];
    const nextScorchesList = [...(state.scorches || [])];

    const activeRockets = (state.flyingRockets || []).map(r => {
      let rocket = { ...r };
      rocket.progress += 1;

      const ratio = rocket.progress / rocket.totalFrames;
      rocket.currentX = rocket.startX + (rocket.targetX - rocket.startX) * ratio;
      rocket.currentY = rocket.startY + (rocket.targetY - rocket.startY) * ratio;

      if (rocket.progress >= rocket.totalFrames) {
        postRocketEnemies = postRocketEnemies.map(enemy => {
          const dist = Math.sqrt((enemy.x - rocket.targetX) ** 2 + (enemy.y - rocket.targetY) ** 2);

          if (dist <= rocket.blastRadius) {
            const resistMul = enemy.splashResist ? (1 - enemy.splashResist) : 1;
            const finalRocketDamage = Math.round(rocket.damage * resistMul);

            combinedDamageTexts.push({
              id: Math.random(),
              x: enemy.x,
              y: enemy.y - 15,
              text: `-${finalRocketDamage}`,
              color: rocket.spec === 'nuke' ? '#FF3D00' : '#FF9100',
              alpha: 1,
              timer: 45
            });

            return { ...enemy, hp: enemy.hp - finalRocketDamage };
          }
          return enemy;
        });

        nextExplosions.push({
          id: Math.random(),
          x: rocket.targetX,
          y: rocket.targetY,
          type: 'bomb_blast',
          angle: Math.random() * Math.PI * 2,
          currentFrame: 0,
          tickCounter: 0,
          cols: 4,
          rows: 2,
          totalFrames: 8,
          animSpeed: 5,
          size: rocket.blastRadius * 2
        });

        nextScorchesList.push({
          id: Math.random(),
          x: rocket.targetX,
          y: rocket.targetY,
          size: rocket.blastRadius * 0.8,
          angle: Math.random() * Math.PI * 2,
          timer: 1800,
          maxTimer: 1800
        });

        return null;
      }
      return rocket;
    }).filter(r => r !== null);

    // Фильтруем выживших после ракет
    const finalAliveEnemies = postRocketEnemies.filter(e => e.hp > 0);

    // --- Кратеры от взрывов ---
    const nextScorches = nextScorchesList.map(s => ({
      ...s,
      timer: s.timer - 1
    })).filter(s => s.timer > 0);

    // --- Следы слизи от лапок ---
    const activeTrails = (state.slimeTrails || []).map(trail => ({
      ...trail,
      timer: trail.timer - 1
    })).filter(trail => trail.timer > 0);

    const freshTrails = movementData.spawnedTrailsInThisFrame || [];
    const finalSlimeTrails = [...activeTrails, ...freshTrails];

    if (finalSlimeTrails.length > 400) {
      finalSlimeTrails.splice(0, finalSlimeTrails.length - 400);
    }

    // --- Таймер вспышки щита базы ---
    let nextShieldFlash = state.shieldFlashTimer || 0;
    if (nextShieldFlash > 0) nextShieldFlash -= 1;

    // =========================================================================
    // 2. ТЕПЕРЬ ПРОВЕРЯЕМ ОКОНЧАНИЕ ВОЛНЫ И ПЕРЕХОД НА СЛЕДУЮЩИЙ УРОВЕНЬ
    // =========================================================================
    let waveActive = spawnData.waveActive ?? state.waveActive;
    let waveTimer = spawnData.waveTimer;
    let activeHoleIndex = state.activeHoleIndex;
    let nextTransitionTimer = state.transitionDelayTimer || 0;

    if (waveActive && spawnData.spawnQueue.length === 0 && finalAliveEnemies.length === 0) {
      const currentLvlConfig = LEVELS_CONFIG[state.currentLevel];

      if (state.levelWaveNumber >= currentLvlConfig.maxWaves) {
        if (nextTransitionTimer === 0) {
          nextTransitionTimer = 300;
        }

        nextTransitionTimer -= 1;

        if (nextTransitionTimer > 0) {
          return {
            waveNumber: state.waveNumber,
            levelWaveNumber: state.levelWaveNumber,
            waveTimer: 0,
            waveActive: true,
            spawnTimer: spawnData.spawnTimer,
            spawnQueue: [],
            enemies: finalAliveEnemies,
            cakeHp: movementData.cakeHp,
            gameOver: movementData.gameOver,
            towers: towersData.towers,
            bullets: combatData.bullets,
            explosions: nextExplosions,
            gold: combatData.gold,
            score: nextScore,
            killedStats: nextKilledStats,
            damageTexts: combinedDamageTexts,
            droppedItems: finalDroppedItems,
            particles: nextParticles,
            flyingRockets: activeRockets,
            activeHoleIndex: null,
            scorches: nextScorches,
            slimeTrails: finalSlimeTrails,
            shieldFlashTimer: nextShieldFlash,
            transitionDelayTimer: nextTransitionTimer
          };
        }

        // Таймер 5 секунд истек -> Переключаем уровень
        return {
          waveActive: false,
          enemies: [],
          spawnQueue: [],
          bullets: [],
          explosions: nextExplosions.filter(e => e.id !== 'road_hole_effect'),
          activeHoleIndex: null,
          levelTransition: true,
          nextIncomingLevel: state.currentLevel + 1,
          gold: combatData.gold + 200,
          score: nextScore,
          killedStats: nextKilledStats,
          damageTexts: [],
          droppedItems: [],
          transitionDelayTimer: 0,
          selectedTowerId: null,   // Автоматом закрываем меню апгрейда башни
          selectedTowerType: null, // Сбрасываем выбранную в магазине башню
          buildPreview: null,      // Убираем призрак постройки
          isAimingRocket: false
        };
      } else {
        waveActive = false;
        activeHoleIndex = null;
        nextExplosions = nextExplosions.filter(e => e.id !== 'road_hole_effect');
        waveTimer = 900;
      }
    }

    // =========================================================================
    // 3. ОБЫЧНЫЙ ВОЗВРАТ СТЕЙТА В ТЕЧЕНИЕ КАДРА
    // =========================================================================
    return {
      waveNumber: state.waveNumber,
      levelWaveNumber: state.levelWaveNumber,
      waveTimer,
      waveActive,
      spawnTimer: spawnData.spawnTimer,
      spawnQueue: spawnData.spawnQueue,
      enemies: finalAliveEnemies,
      cakeHp: movementData.cakeHp,
      gameOver: movementData.gameOver,
      towers: towersData.towers,
      bullets: combatData.bullets,
      explosions: nextExplosions,
      gold: combatData.gold,
      score: nextScore,
      killedStats: nextKilledStats,
      damageTexts: combinedDamageTexts,
      droppedItems: finalDroppedItems,
      particles: nextParticles,
      flyingRockets: activeRockets,
      activeHoleIndex,
      decorations: state.decorations,
      scorches: nextScorches,
      slimeTrails: finalSlimeTrails,
      shieldFlashTimer: nextShieldFlash
    };

  }),



  enterRocketAimMode: () => set({ isAimingRocket: true, selectedTowerId: null }),

  launchRocket: (targetX, targetY) => set((state) => {
    const { towers, flyingRockets, currentLevel } = state;
    const silo = towers.find(t => t.isRocketSilo);
    if (!silo || silo.ammoReady <= 0 || silo.underConstruction) return {};

    const pad = LEVELS_CONFIG[currentLevel].rocketPad;

    // Рассчитываем базовые характеристики на основе уровня
    const lvl = silo.level || 1;
    let urok = 200 * Math.pow(1.2, lvl - 1);
    let radius = 65;
    let baseSpeed = 3.5 + (lvl * 0.5);

    // Модификаторы специализаций 5-го уровня
    if (silo.specialization === 'nuke') {
      urok = urok * 1.5; // Ядерный удар: +50% к урону от 4 уровня
    } else if (silo.specialization === 'grad') {
      radius = radius * 1.33; // Град: +33% к радиусу поражения, урон как на 4 лвл
      urok = 200 * Math.pow(1.2, 3);
    }

    // Рассчитываем время полета (до 5 секунд, то есть макс 300 кадров)
    const dist = Math.sqrt((targetX - pad.x) ** 2 + (targetY - pad.y) ** 2);
    const totalFrames = Math.min(300, Math.round(dist / baseSpeed));

    const newRocket = {
      id: Math.random(),
      startX: pad.x,
      startY: pad.y,
      currentX: pad.x,
      currentY: pad.y,
      targetX: targetX,
      targetY: targetY,
      progress: 0,
      totalFrames: totalFrames || 60,
      damage: Math.round(urok),
      blastRadius: Math.round(radius),
      spec: silo.specialization || 'normal'
    };

    // Списываем заряд у шахты
    const updatedTowers = towers.map(t => {
      if (t.isRocketSilo) {
        return { ...t, ammoReady: 0, chargeTimer: 1500 }; // 25 секунд * 60 кадров = 1500
      }
      return t;
    });

    return {
      towers: updatedTowers,
      flyingRockets: [...flyingRockets, newRocket],
      isAimingRocket: false
    };
  }),




}));
