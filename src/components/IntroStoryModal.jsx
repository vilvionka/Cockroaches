import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { INTRO_SLIDES } from '../store/storyData';
import { RadioCommBox } from './RadioCommBox';
import styles from '../App.module.css';

export const IntroStoryModal = ({ gameStarted }) => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const waveNumber = useGameStore((state) => state.waveNumber);
  const enemiesCount = useGameStore((state) => state.enemies.length);
  const towersCount = useGameStore((state) => state.towers.length);

  const [isVisible, setIsVisible] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const dismissedForRunRef = useRef(false);

  // Сбрасываем флаг при перезапуске игры (когда уровень снова 1, волн 0 и поле пустое)
  useEffect(() => {
    if (currentLevel === 1 && waveNumber === 0 && enemiesCount === 0 && towersCount === 0) {
      if (!isVisible && !dismissedForRunRef.current && gameStarted) {
        setSlideIdx(0);
        setIsVisible(true);
        useGameStore.setState({ isStoryPaused: true });
      }
    } else {
      // Как только началась волна или постройка — готовимся к возможному будущему рестарту
      dismissedForRunRef.current = false;
    }
  }, [gameStarted, currentLevel, waveNumber, enemiesCount, towersCount, isVisible]);

  if (!isVisible) return null;

  const slide = INTRO_SLIDES[slideIdx];
  const isLast = slideIdx === INTRO_SLIDES.length - 1;

  const handleFinish = () => {
    dismissedForRunRef.current = true;
    setIsVisible(false);
    useGameStore.setState({ isStoryPaused: false });
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setSlideIdx((prev) => prev + 1);
    }
  };

  return (
    <div className={styles.story_poster_overlay}>
      <div
        className={styles.story_poster_bg}
        style={{ backgroundImage: "url('./story_intro.jpg')" }}
      />
      <div className={styles.story_poster_vignette} />

      <div className={styles.story_bottom_panel}>
        <RadioCommBox
          speakerKey={slide.speaker}
          badge={slide.badge}
          text={slide.text}
        />

        <div className={styles.story_controls_row}>
          <div className={styles.tutorial_dots} style={{ marginBottom: 0 }}>
            {INTRO_SLIDES.map((_, i) => (
              <span
                key={i}
                className={styles.tutorial_dot}
                data-active={i === slideIdx}
              />
            ))}
          </div>

          <div className={styles.story_btns}>
            <button
              type="button"
              onClick={handleFinish}
              className={styles.confirm_no_btn}
              style={{ padding: '9px 14px' }}
            >
              ПРОПУСТИТЬ
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={styles.supply_claim_btn}
              style={{ padding: '9px 20px' }}
            >
              {isLast ? 'К ОБОРОНЕ ➔' : 'ДАЛЕЕ ➔'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
