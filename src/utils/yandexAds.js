// Полноэкранная реклама (между уровнями)
export const showFullscreenAd = (onComplete) => {
  if (!window.ysdk?.adv) {
    console.log('[DEV] Имитация межстраничной рекламы Яндекс Игр');
    if (onComplete) onComplete();
    return;
  }

  window.ysdk.features?.GameplayAPI?.stop();

  window.ysdk.adv.showFullscreenAdv({
    callbacks: {
      onClose: () => {
        window.ysdk.features?.GameplayAPI?.start();
        if (onComplete) onComplete();
      },
      onError: (err) => {
        console.warn('Fullscreen ad error:', err);
        window.ysdk.features?.GameplayAPI?.start();
        if (onComplete) onComplete();
      }
    }
  });
};

// Видео за вознаграждение (экстренный ракетный удар с базы)
export const showRewardedAd = ({ onRewarded, onClose }) => {
  if (!window.ysdk?.adv) {
    console.log('[DEV] Имитация рекламы за вознаграждение — удар подтверждён');
    if (onRewarded) onRewarded();
    if (onClose) onClose();
    return;
  }

  let rewarded = false;
  window.ysdk.features?.GameplayAPI?.stop();

  window.ysdk.adv.showRewardedVideo({
    callbacks: {
      onOpen: () => {
        window.ysdk.features?.GameplayAPI?.stop();
      },
      onRewarded: () => {
        rewarded = true;
      },
      onClose: () => {
        window.ysdk.features?.GameplayAPI?.start();
        if (rewarded && onRewarded) onRewarded();
        if (onClose) onClose();
      },
      onError: (err) => {
        console.warn('Rewarded ad error:', err);
        window.ysdk.features?.GameplayAPI?.start();
        if (onClose) onClose();
      }
    }
  });
};
