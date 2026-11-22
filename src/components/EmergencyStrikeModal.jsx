import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { showRewardedAd } from '../utils/yandexAds';
import styles from '../App.module.css';

export const EmergencyStrikeModal = () => {
  const isOpen = useGameStore((state) => state.isEmergencyAdOpen);
  const triggerEmergencyRocket = useGameStore((state) => state.triggerEmergencyRocket);
  const declineEmergencyStrike = useGameStore((state) => state.declineEmergencyStrike);

  const [isLoadingAd, setIsLoadingAd] = useState(false);

  if (!isOpen) return null;

  const handleWatchAd = () => {
    if (isLoadingAd) return;
    setIsLoadingAd(true);

    showRewardedAd({
      onRewarded: () => {
        triggerEmergencyRocket();
      },
      onClose: () => {
        setIsLoadingAd(false);
        // Если игрок закрыл рекламу досрочно без награды — просто снимаем паузу
        if (useGameStore.getState().isEmergencyAdOpen) {
          declineEmergencyStrike();
        }
      }
    });
  };

  return (
    <div className={styles.emergency_overlay}>
      <div className={styles.emergency_card}>
        <div className={styles.emergency_badge}>ТРЕВОГА // УГРОЗА ПРОРЫВА ПЕРИМЕТРА</div>
        <h2 className={styles.emergency_title}>ВРАГ У СТЕН БАЗЫ!</h2>
        <p className={styles.emergency_desc}>
          Орбитальное командование готово нанести экстренный ракетный удар прямо с турели Базы по ближайшему скоплению роя.
        </p>

        <div className={styles.emergency_specs}>
          <span>УРОН УДАРА: <b>10000 HP</b></span>
          <span>РАДИУС: <b>65</b></span>
        </div>

        <div className={styles.emergency_actions}>
          <button
            type="button"
            disabled={isLoadingAd}
            onClick={handleWatchAd}
            className={styles.emergency_watch_btn}
          >
            {isLoadingAd ? 'ЗАГРУЗКА ТРАНСЛЯЦИИ...' : '▶ СМОТРЕТЬ РЕКЛАМУ И НАНЕСТИ УДАР'}
          </button>

          <button
            type="button"
            disabled={isLoadingAd}
            onClick={declineEmergencyStrike}
            className={styles.emergency_skip_btn}
          >
            ОТКЛОНИТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
