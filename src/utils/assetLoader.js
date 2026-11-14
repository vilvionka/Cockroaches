// Объект, где хранятся все загруженные картинки игры
export const assets = {
  bg: { img: new Image(), loaded: false },
  base: { img: new Image(), loaded: false },
  silo_rocket: { img: new Image(), loaded: false },
  towers: {}, // ИСПРАВЛЕНИЕ: теперь здесь объект для разных видов башен
  sprites: {},
  explosions: {},
  roadStraight: { img: new Image(), loaded: false },
  roadCorner: { img: new Image(), loaded: false },
  roadTJunction: { img: new Image(), loaded: false },
  decor: {},
  scorchCrater: { img: new Image(), loaded: false },
};




const bugTypes = ['normal', 'ant', 'beetle', 'rhino', 'fly'];
const combatTowerTypes = ['gun', 'bomb', 'frost'];
const antennaTypes = ['an3', 'an4', 'an5'];


export const loadLevelDecor = (levelNum, onComplete) => {
  assets.decor['obj1'] = { img: new Image(), loaded: false };
  assets.decor['obj2'] = { img: new Image(), loaded: false };

  let loaded = 0;
  const check = () => {
    loaded++;
    if (loaded === 2 && onComplete) onComplete();
  };

  assets.decor['obj1'].img.src = `/decor/level${levelNum}_obj1.png`;
  assets.decor['obj1'].img.onload = () => { assets.decor['obj1'].loaded = true; check(); };
  assets.decor['obj1'].img.onerror = check;

  assets.decor['obj2'].img.src = `/decor/level${levelNum}_obj2.png`;
  assets.decor['obj2'].img.onload = () => { assets.decor['obj2'].loaded = true; check(); };
  assets.decor['obj2'].img.onerror = check;
};


export const loadAllAssets = (onComplete) => {
  let totalImages = 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + combatTowerTypes.length + 1 + (bugTypes.length * 3); // +1 для общей antenna.png
  let loadedCount = 0;

  const checkProgress = () => {
    loadedCount++;
    if (loadedCount === totalImages && onComplete) {
      onComplete(); // Сработает строго тогда, когда загрузится абсолютно всё
    }
  };




  // ИСПРАВЛЕНИЕ: Функция объявлена в самом начале, теперь её можно безопасно вызывать ниже
  const initImage = (obj, src) => {
    if (!obj) return console.error(`Объект ассета не инициализирован для: ${src}`);
    obj.img.src = src;
    obj.img.onload = () => { obj.loaded = true; checkProgress(); };
    obj.img.onerror = () => { console.error(`Ошибка загрузки ассета: ${src}`); checkProgress(); };
  };


  // 1. Загружаем фоны и текстуры среды
  initImage(assets.bg, '/bg.jpg');

  initImage(assets.scorchCrater, '/scorch_crater.png');
  // ДОБАВЛЕНО: Загрузка изображения вашей базы (положите файл base.png в папку public)
  initImage(assets.base, '/base.png');
  initImage(assets.silo_rocket, '/tower_silo.png');
  assets.towers['silo'] = assets.silo_rocket;

  // Внутри loadAllAssets в utils/assetLoader.js:
  assets.explosions['hole_spawn'] = { img: new Image(), loaded: false };
  assets.explosions['hole_loop'] = { img: new Image(), loaded: false }; // Оставляем этот же ключ для совместимости

  initImage(assets.explosions['hole_spawn'], '/hole_spawn.png'); // Спрайт-лист зарождения (8 кадров)
  initImage(assets.explosions['hole_loop'], '/black_hole_photo.png'); // 👈 Твоё цельное красивое фото!


  initImage(assets.roadStraight, '/road_straight.png');
  initImage(assets.roadCorner, '/road_corner.png');
  initImage(assets.roadTJunction, '/road_t_junction.png');

  combatTowerTypes.forEach((type) => {
    assets.towers[type] = { img: new Image(), loaded: false };
    initImage(assets.towers[type], `/tower_${type}.png`);
  });

  // Загружаем отдельные картинки для каждого типа антенн
  antennaTypes.forEach((type) => {
    // Переводим типы 'an3', 'an4', 'an5' в формат ваших названий файлов 'antenna-3', 'antenna-4', 'antenna-5'
    const fileNumber = type.replace('an', '');

    assets.towers[type] = { img: new Image(), loaded: false };
    initImage(assets.towers[type], `/antenna-${fileNumber}.png`);
  });

  // 3. Загружаем спрайты жуков и их смертей
  bugTypes.forEach((type) => {
    assets.sprites[type] = { img: new Image(), loaded: false };
    assets.explosions[type] = { img: new Image(), loaded: false };

    const fileSuffix = type === 'normal' ? 'cockroach' : type;

    initImage(assets.sprites[type], `/${fileSuffix}.png`);
    initImage(assets.explosions[type], `/explosion_${type}.png`);

    // 👇 ДОБАВЛЯЕМ: Загрузка картинок маток (сохраняем в новый ключ 'queen_' + тип)
    assets.sprites[`queen_${type}`] = { img: new Image(), loaded: false };
    initImage(assets.sprites[`queen_${type}`], `/queen_${fileSuffix}.png`);
  });
  assets.explosions['bomb_blast'] = { img: new Image(), loaded: false };
  initImage(assets.explosions['bomb_blast'], '/explosion_bomb.png');
};