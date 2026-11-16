import { invalidateMapCache } from './drawer';

export const assets = {
  poster: { img: new Image(), loaded: false },
  bg: { img: new Image(), loaded: false },
  base: { img: new Image(), loaded: false },
  rocketPad: { img: new Image(), loaded: false },
  scorchCrater: { img: new Image(), loaded: false },
  silo_rocket: { img: new Image(), loaded: false },
  roadStraight: { img: new Image(), loaded: false },
  roadCorner: { img: new Image(), loaded: false },
  roadTJunction: { img: new Image(), loaded: false },
  towers: {},
  sprites: {},
  explosions: {},
  decor: {}
};

export const loadLevelDecor = (levelNum, onComplete) => {
  invalidateMapCache();

  const bgImg = new Image();
  const obj1 = new Image();
  const obj2 = new Image();

  assets.bg = { img: bgImg, loaded: false };
  assets.decor.obj1 = { img: obj1, loaded: false };
  assets.decor.obj2 = { img: obj2, loaded: false };

  let doneCount = 0;
  const checkDone = () => {
    doneCount += 1;
    if (doneCount >= 3) {
      invalidateMapCache();
      if (onComplete) onComplete();
    }
  };

  bgImg.onload = () => {
    assets.bg.loaded = true;
    checkDone();
  };
  bgImg.onerror = () => {
    // Запасной фолбэк на общий bg.jpg, если файла для уровня нет
    if (!bgImg.src.endsWith('/bg.jpg')) {
      bgImg.src = './bg.jpg';
    } else {
      checkDone();
    }
  };

  obj1.onload = () => { assets.decor.obj1.loaded = true; checkDone(); };
  obj1.onerror = () => { checkDone(); };

  obj2.onload = () => { assets.decor.obj2.loaded = true; checkDone(); };
  obj2.onerror = () => { checkDone(); };

  bgImg.src = `./bg_level${levelNum}.jpg`;
  obj1.src = `./decor/level${levelNum}_obj1.png`;
  obj2.src = `./decor/level${levelNum}_obj2.png`;
};



let preloadPromise = null;

export const preloadAllAssets = (onProgress) => {
  if (preloadPromise) {
    preloadPromise.then(() => {
      if (onProgress) onProgress(100);
    });
    return preloadPromise;
  }

  preloadPromise = new Promise((resolve) => {
    const queue = [];

    const register = (targetObj, src) => {
      queue.push({ targetObj, src });
    };

    register(assets.poster, './poster.jpg');
    register(assets.base, './base.png');
    register(assets.scorchCrater, './scorch_crater.png');
    register(assets.silo_rocket, './silo_rocket.png');
    register(assets.roadStraight, './road_straight.png');
    register(assets.roadCorner, './road_corner.png');
    register(assets.roadTJunction, './road_t_junction.png');

    ['gun', 'bomb', 'frost'].forEach((type) => {
      assets.towers[type] = { img: new Image(), loaded: false };
      register(assets.towers[type], `./tower_${type}.png`);
    });

    assets.towers.silo = { img: new Image(), loaded: false };
    register(assets.towers.silo, './tower_silo.png');
    register(assets.rocketPad, './rocket_pad.png');


    [3, 4, 5].forEach((num) => {
      const key = `an${num}`;
      assets.towers[key] = { img: new Image(), loaded: false };
      register(assets.towers[key], `./antenna-${num}.png`);
    });

    const enemiesMap = {
      normal: 'cockroach',
      ant: 'ant',
      beetle: 'beetle',
      rhino: 'rhino',
      fly: 'fly'
    };

    Object.entries(enemiesMap).forEach(([key, file]) => {
      assets.sprites[key] = { img: new Image(), loaded: false };
      register(assets.sprites[key], `./${file}.png`);

      const queenKey = `queen_${file}`;
      assets.sprites[queenKey] = { img: new Image(), loaded: false };
      register(assets.sprites[queenKey], `./queen_${file}.png`);
    });

    register(assets.explosions.hole_spawn = { img: new Image(), loaded: false }, './hole_spawn.png');
    register(assets.explosions.hole_loop = { img: new Image(), loaded: false }, './black_hole_photo.png');
    register(assets.explosions.bomb_blast = { img: new Image(), loaded: false }, './explosion_bomb.png');

    Object.keys(enemiesMap).forEach((type) => {
      assets.explosions[type] = { img: new Image(), loaded: false };
      register(assets.explosions[type], `./explosion_${type}.png`);
    });

    loadLevelDecor(1);

    const total = queue.length;
    let loadedCount = 0;
    let isResolved = false;

    const finish = () => {
      if (isResolved) return;
      isResolved = true;
      if (onProgress) onProgress(100);
      resolve();
    };

    const handleStep = () => {
      loadedCount += 1;
      const percent = Math.min(100, Math.round((loadedCount / total) * 100));
      if (onProgress) onProgress(percent);
      if (loadedCount >= total) {
        finish();
      }
    };

    queue.forEach(({ targetObj, src }) => {
      targetObj.img.onload = () => {
        targetObj.loaded = true;
        handleStep();
      };
      targetObj.img.onerror = () => {
        handleStep();
      };
      targetObj.img.src = src;
    });

    // Страховочный таймер на случай зависания сети
    setTimeout(finish, 5000);
  });

  return preloadPromise;
};

export const loadAllAssets = preloadAllAssets;
