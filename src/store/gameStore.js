import { create } from 'zustand';
import * as helpers from './gameHelpers';
import { loadLevelDecor } from '../utils/assetLoader';
import { saveProgress } from '../utils/storage';


export const LEVEL_UNLOCK_INFO = {
  2: {
    level: 2,
    type: 'silo',
    name: 'РАКЕТНАЯ ШАХТА',
    image: './tower_silo.png',
    badge: 'НОВОЕ СУПЕРОРУЖИЕ РАЗБЛОКИРОВАНО',
    stats: [
      { label: 'СТОИМОСТЬ', value: '500 КР.' },
      { label: 'ДАЛЬНОСТЬ', value: 'ВСЯ КАРТА' },
      { label: 'ТИП УДАРА', value: 'ТОЧЕЧНЫЙ ЗАЛП' }
    ],
    description: 'Стационарная пусковая установка. Размещается на специальной стартовой площадке и позволяет наносить ручной ракетный удар по любой точке дороги.'
  },
  3: {
    level: 3,
    type: 'mlrs',
    name: 'БОЕВАЯ РСЗО',
    image: './tower_mlrs.png',
    badge: 'НОВАЯ АРТИЛЛЕРИЙСКАЯ СИСТЕМА',
    stats: [
      { label: 'СТОИМОСТЬ', value: '450 КР.' },
      { label: 'ЗОНА ОГНЯ', value: '300 – 400 PX' },
      { label: 'ЗАЛП', value: '5 РЕАКТИВНЫХ СНАРЯДОВ' }
    ],
    description: 'Дальнобойная система залпового огня. Не бьёт вблизи (мёртвая зона до 300 px), но накрывает дорогу каскадом из 5 снарядов (3 вперёд и 2 назад вдоль пути) с микро-задержкой.'
  }
  // Сюда позже легко добавите 4: { ... } и 5: { ... }
};

export const LEVEL_TOWER_LIMITS = {
  1: { gun: 3, bomb: 4, frost: 2, mlrs: 0 },
  2: { gun: 4, bomb: 4, frost: 2, mlrs: 0 },
  3: { gun: 4, bomb: 5, frost: 2, mlrs: 2 },
  4: { gun: 4, bomb: 5, frost: 2, mlrs: 3 },
  5: { gun: 5, bomb: 6, frost: 3, mlrs: 3 } // Задел на 5-й уровень
};

export const getMaxTowerLimit = (towerType, currentLevel, bonusTowerLimits = {}) => {
  const levelLimits = LEVEL_TOWER_LIMITS[currentLevel] || LEVEL_TOWER_LIMITS[4];
  if (levelLimits[towerType] === undefined) return Infinity;
  const bonus = bonusTowerLimits?.[towerType] || 0;
  return levelLimits[towerType] + bonus;
};





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
    //rocketPad: { x: 650, y: 150 },
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
  },
  3: {
    // Сетка плиток 10x13 (60x60 px каждая)
    tileMap: [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      // Верхняя дорога (row 1 -> y = 90) делает петлю вниз на row 4
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null, null, null, null, null, null],
      [null, null, null, { type: 'straight', angle: 90 }, null, null, { type: 'corner', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null],
      [null, null, null, { type: 'straight', angle: 90 }, null, null, { type: 'straight', angle: 90 }, null, { type: 'straight', angle: 90 }, null, null, null, null],
      // Слияние верхней и нижней дорог на Т-перекрёстке (col 10, row 4 -> x = 630, y = 270) и выход к Базе
      [null, null, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 't_junction', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }],
      [null, null, null, null, null, null, null, null, null, null, { type: 'straight', angle: 90 }, null, null],
      // Нижняя дорога поднимается к перекрёстку
      [null, null, null, null, null, { type: 'corner', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null],
      [null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null, null, null, null],
      // Нижний вход (row 8 -> y = 510)
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ],

    // Физические рельсы строго по центрам плиток для обеих дорог
    paths: [
      // Путь 0: Верхняя дорога
      [
        { x: 0, y: 90 },
        { x: 210, y: 90 },
        { x: 210, y: 270 },
        { x: 390, y: 270 },
        { x: 390, y: 150 },
        { x: 510, y: 150 },
        { x: 510, y: 270 },
        { x: 630, y: 270 },
        { x: 800, y: 270 }
      ],
      // Путь 1: Нижняя дорога
      [
        { x: 0, y: 510 },
        { x: 330, y: 510 },
        { x: 330, y: 390 },
        { x: 630, y: 390 },
        { x: 630, y: 270 },
        { x: 800, y: 270 }
      ]
    ],

    maxWaves: 8,
    basePoint: { x: 800, y: 270 },
    rocketPad: { x: 690, y: 120 }, // Площадка для ракетницы в свободном правом верхнем секторе
    decorations: [
      { id: 'dec_3_1', type: 'obj1', x: 110, y: 330, size: 110 },
      { id: 'dec_3_2', type: 'obj2', x: 470, y: 500, size: 115 }
    ]
  },
  4: {
    // Сетка плиток 10x13 (60x60 px каждая)
    tileMap: [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      // Верхний вход (row 1 -> y = 90) идёт вправо до col 5, затем спускается на row 3
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null, null, null, null],
      [null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null, null, null, null],
      [null, null, null, null, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null],
      // Слияние дорог на Т-перекрёстке (col 8, row 4 -> x = 510, y = 270) и прямой выход к Базе
      [null, null, null, null, null, null, null, null, { type: 't_junction', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }],
      [null, null, { type: 'corner', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null],
      [null, null, { type: 'straight', angle: 90 }, null, { type: 'straight', angle: 90 }, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null],
      // Нижний вход (row 7 -> y = 450) делает петлю вверх на row 5 и уходит на row 8 к перекрёстку
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, { type: 'straight', angle: 90 }, null, null, null, null],
      [null, null, null, null, null, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ],

    // Физические рельсы строго по центрам плиток для обеих дорог
    paths: [
      // Путь 0: Верхняя дорога
      [
        { x: 0, y: 90 },
        { x: 330, y: 90 },
        { x: 330, y: 210 },
        { x: 510, y: 210 },
        { x: 510, y: 270 },
        { x: 800, y: 270 }
      ],
      // Путь 1: Нижняя дорога с двойной петлёй
      [
        { x: 0, y: 450 },
        { x: 150, y: 450 },
        { x: 150, y: 330 },
        { x: 270, y: 330 },
        { x: 270, y: 450 },
        { x: 390, y: 450 },
        { x: 390, y: 510 },
        { x: 510, y: 510 },
        { x: 510, y: 270 },
        { x: 800, y: 270 }
      ]
    ],

    maxWaves: 9,
    basePoint: { x: 800, y: 270 },
    rocketPad: { x: 660, y: 120 }, // Площадка для ракетницы в правом верхнем секторе
    decorations: [
      { id: 'dec_4_1', type: 'obj1', x: 150, y: 210, size: 110 },
      { id: 'dec_4_2', type: 'obj2', x: 660, y: 440, size: 120 }
    ]
  },
  5: {
    // Сетка плиток 10x13 (60x60 px каждая) — 3 маршрута, сходящиеся на двух Т-перекрёстках
    tileMap: [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      // Верхний вход (row 1 -> y = 90)
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, null, null],
      [null, null, null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null, null],
      // Центральный вход (row 3 -> y = 210) спускается на row 4
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 0 }, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null, null],
      // Главная магистраль (row 4 -> y = 270): два Т-перекрёстка (col 7 и col 10) перед Базой
      [null, null, null, { type: 'corner', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 't_junction', angle: 180 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 't_junction', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }],
      [null, null, null, null, null, null, null, null, null, null, { type: 'straight', angle: 90 }, null, null],
      // Нижняя дорога поднимается ко второму перекрёстку
      [null, null, null, null, null, { type: 'corner', angle: 270 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null],
      [null, null, null, null, null, { type: 'straight', angle: 90 }, null, null, null, null, null, null, null],
      // Нижний вход (row 8 -> y = 510)
      [{ type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'straight', angle: 0 }, { type: 'corner', angle: 90 }, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ],

    // Физические рельсы строго по центрам плиток для всех трёх дорог
    paths: [
      // Путь 0: Верхний фланг
      [
        { x: 0, y: 90 },
        { x: 450, y: 90 },
        { x: 450, y: 270 },
        { x: 630, y: 270 },
        { x: 800, y: 270 }
      ],
      // Путь 1: Центральный прорыв
      [
        { x: 0, y: 210 },
        { x: 210, y: 210 },
        { x: 210, y: 270 },
        { x: 450, y: 270 },
        { x: 630, y: 270 },
        { x: 800, y: 270 }
      ],
      // Путь 2: Нижний обходной путь
      [
        { x: 0, y: 510 },
        { x: 330, y: 510 },
        { x: 330, y: 390 },
        { x: 630, y: 390 },
        { x: 630, y: 270 },
        { x: 800, y: 270 }
      ]
    ],

    maxWaves: 10,
    basePoint: { x: 800, y: 270 },
    rocketPad: { x: 690, y: 120 },
    decorations: [
      { id: 'dec_5_1', type: 'obj1', x: 560, y: 150, size: 105 },
      { id: 'dec_5_2', type: 'obj2', x: 150, y: 390, size: 115 }
    ]
  },



};


export const MAP_OFFSET_X = 120; // Сдвиг карты вправо на 2 плитки (60 * 2 = 120 px) для Canvas 920x600

export const getShiftedLevelData = (levelNum) => {
  const cfg = LEVELS_CONFIG[levelNum] || LEVELS_CONFIG[1];

  const paths = cfg.paths.map((path) => {
    const shifted = path.map((pt) => ({ x: pt.x + MAP_OFFSET_X, y: pt.y }));
    // Продлеваем вход с самого левого края экрана (x = 0) до сдвинутого начала дороги
    if (shifted.length > 0 && shifted[0].x > 0) {
      return [{ x: 0, y: shifted[0].y }, ...shifted];
    }
    return shifted;
  });

  const basePoint = {
    x: cfg.basePoint.x + MAP_OFFSET_X,
    y: cfg.basePoint.y
  };

  const rocketPad = cfg.rocketPad
    ? { x: cfg.rocketPad.x + MAP_OFFSET_X, y: cfg.rocketPad.y }
    : null;

  const decorations = (cfg.decorations || []).map((dec) => ({
    ...dec,
    x: dec.x + MAP_OFFSET_X
  }));

  return { paths, basePoint, rocketPad, decorations, maxWaves: cfg.maxWaves };
};


const createWaveCheckpoint = (state, waveNum, levelWaveNum, towersSnapshot) => ({
  currentLevel: state.currentLevel,
  waveNumber: waveNum,
  levelWaveNumber: levelWaveNum,
  gold: state.gold,
  cakeHp: Math.max(30, state.cakeHp), // Минимум 30 HP при возрождении, чтобы был шанс отбиться
  maxCakeHp: state.maxCakeHp || 100,
  score: state.score,
  killedStats: { ...state.killedStats },
  boostsInventory: { ...state.boostsInventory },
  bonusTowerLimits: { ...(state.bonusTowerLimits || { gun: 0, bomb: 0, frost: 0, mlrs: 0 }) },
  towers: towersSnapshot.map((t) => ({
    ...t,
    activeBoosts: t.activeBoosts ? { ...t.activeBoosts } : undefined
  }))
});







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
  isSupplyDropOpen: true, // Открываем кейсы на старте 1-го уровня
  bonusTowerLimits: { gun: 0, bomb: 0, frost: 0, mlrs: 0 }, // Доп. лимиты из кейсов на текущий уровень




  roadPaths: getShiftedLevelData(1).paths,
  decorations: getShiftedLevelData(1).decorations,

  waveCheckpoint: null,
  reviveAdsWatched: 0,


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
  isStoryPaused: false,
  isEmergencyAdOpen: false,
  emergencyStrikeUsed: false,
  emergencyCooldown: 0,
  emergencyTarget: null,
  savedScore: 0,
  unlockedWeaponModal: null,



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
      scoreReward: 25,
      spritePath: './beetle.png',
      bloodColor: '#99ff00',
      cols: 4,
      rows: 2,
      totalFrames: 8,
      imgWidth: 1365,
      imgHeight: 768,
      animSpeed: 6,
      // Небольшой доворот в радианах для кадров, где панцирь нарисован под углом
      frameAngles: [0, 0.06, -0.07, 0.03, 0, 0.05, -0.06, 0.02],
      missChance: 0.07,
      name: 'Золотой панцирник',
      description: 'Тяжелый панцирь с большим запасом здоровья. Шанс уклонения от выстрелов — 7%.'
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
      damage: 56,
      minDamage: 52,
      maxDamage: 60,
      critChance: 0.08,
      critMultiplier: 1.5,
      fireRate: 20,
      size: 50,
      bulletType: 'single',
      unlockWave: 1,
      rotationSpeed: 0.05,
      isAntenna: false,
      baseLimit: 3
    },
    bomb: {
      type: 'bomb',
      name: 'Грантомет',
      cost: 200,
      range: 85,
      damage: 165,
      minDamage: 155,
      maxDamage: 175,
      critChance: 0.08,
      critMultiplier: 1.5,
      fireRate: 45,
      size: 50,
      bulletType: 'splash',
      splashRadius: 80,
      splashDamage: 35,
      unlockWave: 2,
      rotationSpeed: 0.025,
      isAntenna: false,
      baseLimit: 4
    },
    frost: { type: 'frost', name: 'Криоген', cost: 300, range: 100, damage: 30, fireRate: 40, size: 50, bulletType: 'frost', slowDuration: 120, slowFactor: 0.5, unlockWave: 3, rotationSpeed: 0.04, isAntenna: false, baseLimit: 3 },

    silo: {
      type: 'silo',
      name: 'Ракета',
      cost: 500,
      range: 9999,
      size: 60,
      isRocketSilo: true,
      unlockWave: 1,
      unlockLevel: 2,
    },

    mlrs: {
      type: 'mlrs',
      name: 'РСЗО',
      cost: 450,
      minRange: 300,       // Внутренний радиус (ближе не стреляет)
      range: 400,          // Внешний радиус (стреляет в кольце 300–400 px)
      damage: 205,         // Урон каждого из 5 снарядов (как у Бомбарды)
      minDamage: 195,
      maxDamage: 215,
      critChance: 0.08,
      critMultiplier: 1.5,
      fireRate: 150,       // Редкий залп (раз в 2.5 секунды)
      size: 52,
      bulletType: 'mlrs',
      splashRadius: 65,
      splashDamage: 120,
      unlockLevel: 3,      // Открывается с 3-го уровня
      unlockWave: 1,
      rotationSpeed: 0.025,
      isAntenna: false,
      baseLimit: 2         // Лимит на 3 уровне: 2 + (3 - 1) = 4 шт. (или поставьте 1, если нужно 3 шт.)
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

  pauseBySystem: () => set((state) => {
    if (
      state.gameOver ||
      state.levelTransition ||
      state.isUserPaused ||
      state.isStoryPaused ||
      state.isSupplyDropOpen ||
      state.isEmergencyAdOpen ||
      state.unlockedWeaponModal
    ) {
      return {};
    }

    window.ysdk?.features?.GameplayAPI?.stop();
    return { isUserPaused: true };
  }),


  claimSupplyDrop: (reward) => set((state) => {
    if (!reward) return { isSupplyDropOpen: false };

    let nextGold = state.gold;
    let nextCakeHp = state.cakeHp;
    let nextMaxCakeHp = state.maxCakeHp || 100;
    const nextBoosts = { ...state.boostsInventory };
    const nextBonusLimits = { ...(state.bonusTowerLimits || { gun: 0, bomb: 0, frost: 0 }) };

    if (reward.type === 'gold') {
      nextGold += reward.amount;
    } else if (reward.type === 'boosts') {
      nextBoosts.damage += reward.damage || 0;
      nextBoosts.fireRate += reward.fireRate || 0;
      nextBoosts.range += reward.range || 0;
    } else if (reward.type === 'baseHp') {
      nextMaxCakeHp += reward.amount;
      nextCakeHp += reward.amount;
    } else if (reward.type === 'towerLimit') {
      nextBonusLimits[reward.tower] = (nextBonusLimits[reward.tower] || 0) + reward.amount;
    } else if (reward.type === 'comboBomb') {
      nextBonusLimits[reward.tower] = (nextBonusLimits[reward.tower] || 0) + reward.amount;
      nextGold += reward.gold || 0;
    }

    if (reward.boosts) {
      nextBoosts.damage += reward.boosts.damage || 0;
      nextBoosts.fireRate += reward.boosts.fireRate || 0;
      nextBoosts.range += reward.boosts.range || 0;
    }

    return {
      gold: nextGold,
      cakeHp: nextCakeHp,
      maxCakeHp: nextMaxCakeHp,
      boostsInventory: nextBoosts,
      bonusTowerLimits: nextBonusLimits,
      isSupplyDropOpen: false
    };
  }),


  applySavedLevel: (savedLevel, savedScore = 0) => set(() => {
    const validLevel = LEVELS_CONFIG[savedLevel] ? savedLevel : 1;
    loadLevelDecor(validLevel);
    const calculatedGold = Math.min(600, validLevel * 150);

    const lvlData = getShiftedLevelData(validLevel);
    return {
      currentLevel: validLevel,
      levelWaveNumber: 0,
      waveNumber: 0,
      roadPaths: lvlData.paths,
      gold: calculatedGold,
      isSupplyDropOpen: true,
      bonusTowerLimits: { gun: 0, bomb: 0, frost: 0, mlrs: 0 },
      emergencyStrikeUsed: false,
      emergencyCooldown: 0,
      isEmergencyAdOpen: false,
      emergencyTarget: null,
      score: savedScore,
      savedScore: savedScore,
      decorations: lvlData.decorations
    };

  }),


  resetAllProgress: async () => {
    await saveProgress(1, 0);
    set({
      currentLevel: 1,
      savedScore: 0
    });
    get().restartGame();
  },





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
    if (state.selectedTowerType === type) {
      return {
        selectedTowerType: null,
        buildPreview: null,
        isAimingRocket: false
      };
    }

    const towerData = state.towerTypes[type];
    if (towerData?.baseLimit !== undefined) {
      const maxAllowed = getMaxTowerLimit(type, state.currentLevel, state.bonusTowerLimits);

      const builtCount = state.towers.filter((t) => t.type === type).length;
      if (builtCount >= maxAllowed) {
        return { selectedTowerType: null, buildPreview: null, isAimingRocket: false };
      }
    }




    // Если выбрали Ракетную Шахту — сразу показываем её превью на стартовой площадке
    if (type === 'silo') {
      const hasSilo = state.towers.some(t => t.isRocketSilo);
      if (hasSilo) return { selectedTowerType: null, buildPreview: null, isAimingRocket: false };

      const towerData = state.towerTypes[type];
      const pad = getShiftedLevelData(state.currentLevel).rocketPad;
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

      const pad = getShiftedLevelData(state.currentLevel).rocketPad;

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
    const basePoint = getShiftedLevelData(currentLevel).basePoint;
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
        isAlert: true,
        alpha: 1,
        timer: 150
      });
    };

    if (towerData.baseLimit !== undefined) {
      const maxAllowed = getMaxTowerLimit(buildPreview.type, currentLevel, state.bonusTowerLimits);

      const builtCount = towers.filter((t) => t.type === buildPreview.type).length;
      if (builtCount >= maxAllowed) {
        pushErrorText("ЛИМИТ БАШЕН");
        return { buildPreview: null, selectedTowerType: null };
      }
    }





    // 1. ДЛЯ ВСЕХ, КРОМЕ РАКЕТЫ: Проверяем наличие связи с базой
    if (!towerData.isRocketSilo) {
      const basePoint = getShiftedLevelData(currentLevel).basePoint;
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
    // 2. ДЛЯ ВСЕХ, КРОМЕ РАКЕТЫ: Проверки геопозиции (база, дороги, пересечения)
    if (!towerData.isRocketSilo) {
      const cakePoint = basePoint;
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

    // Автоматическое усиление базового калибра Пулемёта и Бомбарды на 2–5 уровнях (+15% за уровень)
    const isScaledWeapon = buildPreview.type === 'gun' || buildPreview.type === 'bomb';
    const levelWeaponMul = isScaledWeapon ? 1 + (currentLevel - 1) * 0.15 : 1;

    const scaledDamage = Math.round(towerData.damage * levelWeaponMul);
    const scaledMinDamage = towerData.minDamage !== undefined ? Math.round(towerData.minDamage * levelWeaponMul) : undefined;
    const scaledMaxDamage = towerData.maxDamage !== undefined ? Math.round(towerData.maxDamage * levelWeaponMul) : undefined;
    const scaledSplashDamage = towerData.splashDamage ? Math.round(towerData.splashDamage * levelWeaponMul) : undefined;

    const newTower = {
      ...towerData,
      damage: scaledDamage,
      ...(scaledMinDamage !== undefined && { minDamage: scaledMinDamage, maxDamage: scaledMaxDamage }),
      ...(scaledSplashDamage !== undefined && { splashDamage: scaledSplashDamage }),
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
        } else if (specType === 'big_splash') { // Грантомет: урон по площади
          specModifiers.name = 'Грантомет (АОЕ)';
          specModifiers.splashRadius = Math.round(t.splashRadius * 1.6);
          specModifiers.splashDamage = Math.round(t.splashDamage * 1.5);
        } else if (specType === 'heavy_target') { // Грантомет: урон по цели
          specModifiers.name = 'Грантомет (Сигма)';
          specModifiers.damage = Math.round(t.damage * 2.2);
          specModifiers.minDamage = Math.round(t.minDamage * 2.2);
          specModifiers.maxDamage = Math.round(t.maxDamage * 2.2);
        } else if (specType === 'frost_aoe') { // Заморозка: крио-взрыв
          specModifiers.name = 'Крио-Бластер';
        } else if (specType === 'frost_perma') { // Заморозка: длительный контроль
          specModifiers.name = 'Замораживатель Икс';
          specModifiers.slowDuration = Math.round(t.slowDuration * 1.8);
          specModifiers.slowFactor = 0.35; // Замедляет еще сильнее (до 35% скорости)
        } else if (specType === 'mlrs_aoe') {
          specModifiers.name = 'РСЗО (Шквал АОЕ)';
          specModifiers.splashRadius = Math.round(t.splashRadius * 1.6);
          specModifiers.splashDamage = Math.round(t.splashDamage * 1.5);
        } else if (specType === 'mlrs_heavy') {
          specModifiers.name = 'РСЗО (Бронебойная)';
          specModifiers.damage = Math.round(t.damage * 2.2);
          specModifiers.minDamage = Math.round(t.minDamage * 2.2);
          specModifiers.maxDamage = Math.round(t.maxDamage * 2.2);
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

  closeUnlockWeaponModal: () => set({
    unlockedWeaponModal: null,
    isSupplyDropOpen: true // После ознакомления с новым оружием открываем орбитальные кейсы
  }),



  nextLevel: () => set((state) => {
    const nextLvl = state.nextIncomingLevel;

    if (!LEVELS_CONFIG[nextLvl]) {
      saveProgress(1, 0);
      set({ currentLevel: 1, savedScore: 0 });
      get().restartGame();
      return {};
    }


    const unlockInfo = LEVEL_UNLOCK_INFO[nextLvl] || null;
    // Подгружаем декорации для нового уровня
    loadLevelDecor(nextLvl);

    const calculatedGold = Math.min(600, nextLvl * 150);
    const currentMaxHp = state.maxCakeHp || 100;
    const healedHp = Math.min(currentMaxHp, state.cakeHp + 25);

    const lvlData = getShiftedLevelData(nextLvl);

    return {
      currentLevel: nextLvl,
      levelWaveNumber: 0,
      roadPaths: lvlData.paths,
      basePoint: lvlData.basePoint,
      towers: [],
      bullets: [],
      enemies: [],
      spawnQueue: [],
      unlockedWeaponModal: unlockInfo,
      isSupplyDropOpen: !unlockInfo,
      emergencyStrikeUsed: false,
      isEmergencyAdOpen: false,
      emergencyTarget: null,
      emergencyCooldown: 0,
      activeHoleIndex: null,
      isUserPaused: false,
      isStoryPaused: false,
      waveActive: false,
      waveTimer: 900,
      levelTransition: false,
      transitionDelayTimer: 0,
      slimeTrails: [],
      droppedItems: [],
      particles: [],
      flyingRockets: [],
      scorches: [],
      bonusTowerLimits: { gun: 0, bomb: 0, frost: 0, mlrs: 0 },
      gold: calculatedGold,
      decorations: lvlData.decorations,
      cakeHp: healedHp,
      maxCakeHp: currentMaxHp,
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

    const checkpoint = createWaveCheckpoint(state, nextWaveNumber, nextLevelWaveNumber, resetTowers);


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
      emergencyStrikeUsed: false,
      emergencyCooldown: 0,
      activeHolePathIndex: holePathIndex,
      waveCheckpoint: checkpoint,
      reviveAdsWatched: 0,

    };
  }),


  restartGame: () => set((state) => {
    const startLevel = LEVELS_CONFIG[state.currentLevel] ? state.currentLevel : 1;
    loadLevelDecor(startLevel);
    const calculatedGold = Math.min(600, startLevel * 150);

    const lvlData = getShiftedLevelData(startLevel);

    return {
      currentLevel: startLevel,
      levelWaveNumber: 0,
      waveNumber: 0,
      roadPaths: lvlData.paths,
      enemies: [],
      spawnQueue: [],
      spawnTimer: 0,
      cakeHp: 100,
      maxCakeHp: 100,
      waveTimer: 900,
      waveActive: false,
      emergencyStrikeUsed: false, isEmergencyAdOpen: false, emergencyTarget: null, emergencyCooldown: 0,
      gameOver: false,
      score: state.savedScore || 0,
      isUserPaused: false,
      isStoryPaused: false,
      killedStats: { normal: 0, ant: 0, beetle: 0, rhino: 0, fly: 0, boss: 0 },
      scorches: [],
      gold: calculatedGold,
      towers: [],
      bullets: [],
      explosions: [],
      damageTexts: [],
      slimeTrails: [],
      particles: [],
      droppedItems: [],
      boostsInventory: { damage: 0, fireRate: 0, range: 0 },
      flyingRockets: [],
      isAimingRocket: false,
      shieldFlashTimer: 0,
      activeHoleIndex: null,
      levelTransition: false,
      transitionDelayTimer: 0,
      nextIncomingLevel: startLevel + 1,
      buildPreview: null,
      selectedTowerType: null,
      isSupplyDropOpen: true,
      bonusTowerLimits: { gun: 0, bomb: 0, frost: 0, mlrs: 0 },
      selectedTowerId: null,
      decorations: lvlData.decorations,
    };
  }),


  updateGame: () => set((state) => {
    if (state.gameOver || state.levelTransition || state.isUserPaused || state.isStoryPaused || state.isSupplyDropOpen || state.isEmergencyAdOpen || state.unlockedWeaponModal) return {};


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
      state.emergencyStrikeUsed = false;
      state.emergencyCooldown = 0;

      state.waveCheckpoint = createWaveCheckpoint(
        state,
        nextWaveNumber,
        nextLevelWaveNumber,
        currentTowersState
      );
      state.reviveAdsWatched = 0;


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
      spawnData.explosions || state.explosions, // 👈 Берём взрывы из spawnData, если волна стартовала по таймеру
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


    // Уменьшаем кулдаун повторного предложения удара за рекламу
    let nextEmergencyCooldown = state.emergencyCooldown || 0;
    if (nextEmergencyCooldown > 0) nextEmergencyCooldown -= 1;

    // Проверка угрозы прорыва базы (если удар ещё не использован в этой волне и прошёл кулдаун отказа)
    const maxHp = state.maxCakeHp || 100;
    const isLowHp = movementData.cakeHp > 0 && movementData.cakeHp < maxHp * 0.3;

    if (
      !state.emergencyStrikeUsed &&
      nextEmergencyCooldown === 0 &&
      !state.isEmergencyAdOpen &&
      state.waveActive &&
      isLowHp &&
      finalAliveEnemies.length > 0
    ) {
      const basePt = getShiftedLevelData(state.currentLevel).basePoint;
      let closestThreat = null;
      let minDist = Infinity;

      finalAliveEnemies.forEach((enemy) => {
        const d = Math.sqrt((enemy.x - basePt.x) ** 2 + (enemy.y - basePt.y) ** 2);
        if (d <= 170 && d < minDist) {
          minDist = d;
          closestThreat = enemy;
        }
      });

      if (closestThreat) {
        window.ysdk?.features?.GameplayAPI?.stop();
        return {
          enemies: finalAliveEnemies,
          cakeHp: movementData.cakeHp,
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
          scorches: nextScorches,
          slimeTrails: finalSlimeTrails,
          shieldFlashTimer: nextShieldFlash,
          emergencyCooldown: 0,
          isEmergencyAdOpen: true,
          emergencyTarget: { x: closestThreat.x, y: closestThreat.y }
        };
      }
    }



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
            waveCheckpoint: state.waveCheckpoint,
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

        const unlockedLevel = state.currentLevel + 1;
        const finalBonusGold = combatData.gold + 200;

        if (LEVELS_CONFIG[unlockedLevel]) {
          saveProgress(unlockedLevel, nextScore);
        }

        return {
          waveActive: false,
          enemies: [],
          spawnQueue: [],
          bullets: [],
          explosions: nextExplosions.filter(e => e.id !== 'road_hole_effect'),
          activeHoleIndex: null,
          levelTransition: true,
          nextIncomingLevel: unlockedLevel,
          gold: finalBonusGold,
          score: nextScore,
          savedScore: nextScore,
          killedStats: nextKilledStats,
          damageTexts: [],
          droppedItems: [],
          transitionDelayTimer: 0,
          selectedTowerId: null,
          selectedTowerType: null,
          buildPreview: null,
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
      waveCheckpoint: state.waveCheckpoint,
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
      emergencyCooldown: nextEmergencyCooldown,
      shieldFlashTimer: nextShieldFlash
    };

  }),

  incrementReviveAd: () => set((state) => ({
    reviveAdsWatched: (state.reviveAdsWatched || 0) + 1
  })),

  restoreWaveCheckpoint: () => set((state) => {
    const cp = state.waveCheckpoint;
    if (!cp || cp.currentLevel !== state.currentLevel) return {};

    // Восстанавливаем состояние перед началом проигранной волны (игрок может сразу нажать «В БОЙ!» или дождаться таймера)
    const restoredTowers = cp.towers.map((t) => ({
      ...t,
      cooldown: 0,
      recoilOffset: 0,
      targetEnemyId: null,
      activeBoosts: t.activeBoosts ? { ...t.activeBoosts } : undefined
    }));

    window.ysdk?.features?.GameplayAPI?.start();

    return {
      currentLevel: cp.currentLevel,
      waveNumber: Math.max(0, cp.waveNumber - 1),
      levelWaveNumber: Math.max(0, cp.levelWaveNumber - 1),
      gold: cp.gold,
      cakeHp: cp.cakeHp,
      maxCakeHp: cp.maxCakeHp,
      score: cp.score,
      killedStats: { ...cp.killedStats },
      boostsInventory: { ...cp.boostsInventory },
      bonusTowerLimits: { ...cp.bonusTowerLimits },
      towers: restoredTowers,
      enemies: [],
      spawnQueue: [],
      spawnTimer: 0,
      waveTimer: 900, // 15 секунд на перестановку или мгновенный старт кнопкой «В БОЙ!»
      waveActive: false,
      gameOver: false,
      isUserPaused: false,
      isStoryPaused: false,
      isEmergencyAdOpen: false,
      emergencyStrikeUsed: false,
      emergencyCooldown: 0,
      emergencyTarget: null,
      bullets: [],
      explosions: [],
      damageTexts: [],
      slimeTrails: [],
      particles: [],
      droppedItems: [],
      flyingRockets: [],
      scorches: [],
      activeHoleIndex: null,
      selectedTowerId: null,
      selectedTowerType: null,
      buildPreview: null,
      isAimingRocket: false,
      reviveAdsWatched: 0
    };
  }),




  enterRocketAimMode: () => set({ isAimingRocket: true, selectedTowerId: null }),
  cancelRocketAimMode: () => set({ isAimingRocket: false }),


  launchRocket: (targetX, targetY) => set((state) => {
    const { towers, flyingRockets, currentLevel } = state;
    const silo = towers.find(t => t.isRocketSilo);
    if (!silo || silo.ammoReady <= 0 || silo.underConstruction) return {};

    const pad = getShiftedLevelData(state.currentLevel).rocketPad;


    // Рассчитываем базовые характеристики на основе уровня
    const lvl = silo.level || 1;
    let urok = 2500 * Math.pow(1.2, lvl - 1);
    let radius = 65;
    let baseSpeed = 3.5 + (lvl * 0.5);

    // Модификаторы специализаций 5-го уровня
    if (silo.specialization === 'nuke') {
      urok = urok * 1.5; // Ядерный удар: +50% к урону от 4 уровня
    } else if (silo.specialization === 'grad') {
      radius = radius * 1.33; // Град: +33% к радиусу поражения, урон как на 4 лвл
      urok = 2500 * Math.pow(1.2, 3);
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

  declineEmergencyStrike: () => {
    window.ysdk?.features?.GameplayAPI?.start();
    set({
      isEmergencyAdOpen: false,
      emergencyStrikeUsed: false,
      emergencyCooldown: 360,
      emergencyTarget: null
    });
  },


  triggerEmergencyRocket: () => set((state) => {
    const basePt = getShiftedLevelData(state.currentLevel).basePoint;
    const startX = basePt.x - 30;
    const startY = basePt.y;

    // Берём актуальную позицию ближайшего к базе врага или сохранённую точку угрозы
    let targetX = state.emergencyTarget?.x ?? (basePt.x - 130);
    let targetY = state.emergencyTarget?.y ?? basePt.y;

    if (state.enemies && state.enemies.length > 0) {
      let minDist = Infinity;
      state.enemies.forEach((e) => {
        const d = Math.sqrt((e.x - basePt.x) ** 2 + (e.y - basePt.y) ** 2);
        if (d < minDist) {
          minDist = d;
          targetX = e.x;
          targetY = e.y;
        }
      });
    }

    const dist = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
    const totalFrames = Math.max(35, Math.min(180, Math.round(dist / 4.5)));

    const emergencyRocket = {
      id: Math.random(),
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetX,
      targetY,
      progress: 0,
      totalFrames,
      damage: 10000,
      blastRadius: 65,
      spec: 'normal'
    };

    window.ysdk?.features?.GameplayAPI?.start();

    return {
      isEmergencyAdOpen: false,
      emergencyStrikeUsed: true,
      emergencyTarget: null,
      flyingRockets: [...state.flyingRockets, emergencyRocket]
    };
  }),





}));
