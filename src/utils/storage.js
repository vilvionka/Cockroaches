const STORAGE_KEY = 'star_swarm_progress_v1';

let yandexPlayer = null;

// Инициализация объекта игрока Яндекс SDK (вызывается на StartScreen)
export const initPlayerStorage = async (ysdk) => {
  if (!ysdk) return;
  try {
    yandexPlayer = await ysdk.getPlayer({ scopes: false });
  } catch (err) {
    console.warn('Yandex Player init skipped (guest/local mode):', err);
  }
};

// Сохранение достигнутого уровня и счёта
export const saveProgress = async (level, score = 0) => {
  const payload = {
    savedLevel: Math.max(1, level),
    savedScore: Math.max(0, score),
    updatedAt: Date.now()
  };

  // 1. Всегда дублируем в localStorage (для мгновенного доступа и оффлайна)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('localStorage save error:', e);
  }

  // 2. Сохраняем в облако Яндекс Игр
  if (yandexPlayer) {
    try {
      await yandexPlayer.setData(payload, true);
    } catch (e) {
      console.warn('Yandex cloud save error:', e);
    }
  }
};

// Загрузка сохранённого прогресса при входе в игру
export const loadProgress = async () => {
  let localData = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localData = JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage read error:', e);
  }

  if (yandexPlayer) {
    try {
      const cloudData = await yandexPlayer.getData(['savedLevel', 'savedScore']);
      if (cloudData && typeof cloudData.savedLevel === 'number') {
        // Берём максимальный прогресс, если локально игрок успел пройти дальше
        const bestLevel = Math.max(cloudData.savedLevel, localData?.savedLevel || 1);
        const bestScore = bestLevel === cloudData.savedLevel
          ? (cloudData.savedScore || 0)
          : (localData?.savedScore || 0);

        return { savedLevel: bestLevel, savedScore: bestScore };
      }
    } catch (e) {
      console.warn('Yandex cloud load error:', e);
    }
  }

  return {
    savedLevel: localData?.savedLevel || 1,
    savedScore: localData?.savedScore || 0
  };
};
