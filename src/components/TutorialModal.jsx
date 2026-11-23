import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

const TUTORIAL_STORAGE_KEY = 'star_swarm_tutorial_seen_v1';

const TUTORIAL_STEPS = [
  {
    badge: 'ИНСТРУКТАЖ 1 / 3 // РАЗВЁРТЫВАНИЕ',
    title: 'ПОЗИЦИИ ВДОЛЬ ДОРОГ',
    visual: '🛣️ ➔ 🔫 ➔ ✓',
    text: 'Оборонительные турели размещаются только вдоль дорог, по которым движется рой. Выберите пушку в «Центре снабжения», кликните рядом с дорогой и подтвердите установку зелёной кнопкой (✓).'
  },
  {
    badge: 'ИНСТРУКТАЖ 2 / 3 // ЭНЕРГОСЕТЬ',
    title: 'СИГНАЛ И СЛОТЫ БАЗЫ',
    visual: '🏛️ [ 📶 0/3 ] ➔ 🔫',
    text: 'Каждая башня должна быть подключена к сети управления. Главная База имеет ограниченный радиус сигнала и всего 3 слота подключения (0/3).'
  },
  {
    badge: 'ИНСТРУКТАЖ 3 / 3 // РЕТРАНСЛЯЦИЯ',
    title: 'АНТЕННЫ СВЯЗИ',
    visual: '🏛️ ➔ 📡 АН-3 [ 📶 0/3 ] ➔ 🔫🔫🔫',
    text: 'Когда слоты Базы закончатся или нужно занять дальний участок трассы — постройте Антенну во вкладке «СВЯЗЬ». Она продлит сигнал и откроет новые слоты для турелей.'
  }
];

export const TutorialModal = ({ gameStarted }) => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const isSupplyDropOpen = useGameStore((state) => state.isSupplyDropOpen);
  const unlockedWeaponModal = useGameStore((state) => state.unlockedWeaponModal);

  const [stepIndex, setStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;

    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    } catch (e) {
      alreadySeen = false;
    }

    // Показываем только на 1-м уровне, если обучение ещё не закрывали и закрыт стартовый кейс
    if (!alreadySeen && currentLevel === 1 && !isSupplyDropOpen && !unlockedWeaponModal) {
      setIsVisible(true);
    }
  }, [gameStarted, currentLevel, isSupplyDropOpen, unlockedWeaponModal]);

  // Ставим симуляцию на паузу, пока открыт инструктаж, чтобы таймер волны не тикал
  useEffect(() => {
    if (!isVisible) return;
    useGameStore.setState({ isUserPaused: true });
  }, [isVisible]);

  if (!isVisible) return null;

  const currentStep = TUTORIAL_STEPS[stepIndex];
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;

  const handleCloseForever = () => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (e) {
      // Игнорируем ошибку в режиме инкогнито
    }
    setIsVisible(false);
    useGameStore.setState({ isUserPaused: false });
  };

  const handleNext = () => {
    if (isLastStep) {
      handleCloseForever();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div className={styles.tutorial_overlay}>
      <div className={styles.tutorial_card}>
        <div className={styles.tutorial_top_row}>
          <span className={styles.lvl_complete_badge} style={{ marginBottom: 0 }}>
            {currentStep.badge}
          </span>
          <button
            type="button"
            onClick={handleCloseForever}
            className={styles.intel_close_x}
            title="Закрыть обучение"
          >
            ✕
          </button>
        </div>

        <h2 className={styles.tutorial_title}>{currentStep.title}</h2>

        <div className={styles.tutorial_scheme_box}>
          {currentStep.visual}
        </div>

        <p className={styles.tutorial_text}>{currentStep.text}</p>

        {/* Индикатор точек-шагов */}
        <div className={styles.tutorial_dots}>
          {TUTORIAL_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={styles.tutorial_dot}
              data-active={idx === stepIndex}
            />
          ))}
        </div>

        <div className={styles.tutorial_actions}>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((prev) => prev - 1)}
              className={styles.confirm_no_btn}
            >
              НАЗАД
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className={styles.supply_claim_btn}
            style={{ flex: 2, padding: '10px 16px' }}
          >
            {isLastStep ? 'ПОНЯТНО, В БОЙ!' : 'ДАЛЕЕ ➔'}
          </button>
        </div>
      </div>
    </div>
  );
};
