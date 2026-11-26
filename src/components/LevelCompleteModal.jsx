import React, { useState } from 'react';
import { useGameStore, LEVELS_CONFIG } from '../store/gameStore';
import { showFullscreenAd } from '../utils/yandexAds';
import { COMMANDER_VICTORY_LINES, OUTRO_SLIDES } from '../store/storyData';
import { RadioCommBox } from './RadioCommBox';
import styles from '../App.module.css';

export const LevelCompleteModal = () => {
  const levelTransition = useGameStore((state) => state.levelTransition);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const nextIncomingLevel = useGameStore((state) => state.nextIncomingLevel);
  const nextLevel = useGameStore((state) => state.nextLevel);

  const [outroStep, setOutroStep] = useState(0);

  if (!levelTransition) return null;

  const isGameCompleted = !LEVELS_CONFIG[nextIncomingLevel];

  const handleNextClick = () => {
    if (isGameCompleted) {
      setOutroStep(0);
      nextLevel();
      return;
    }
    showFullscreenAd(() => {
      nextLevel();
    });
  };

  // ФИНАЛ ИГРЫ (ПОСЛЕ 5-ГО УРОВНЯ)
  if (isGameCompleted) {
    const slide = OUTRO_SLIDES[outroStep] || OUTRO_SLIDES[0];
    const isLastSlide = outroStep >= OUTRO_SLIDES.length - 1;

    return (
      <div className={styles.story_poster_overlay} style={{ zIndex: 75 }}>
        <div
          className={styles.story_poster_bg}
          style={{ backgroundImage: "url('./story_outro.jpg')" }}
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
              {OUTRO_SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={styles.tutorial_dot}
                  data-active={i === outroStep}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => (isLastSlide ? handleNextClick() : setOutroStep((p) => p + 1))}
              className={styles.supply_claim_btn}
              style={{ padding: '10px 22px' }}
            >
              {isLastSlide ? 'НАЧАТЬ НОВУЮ ИГРУ' : 'ДАЛЕЕ ➔'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ОБЫЧНОЕ ЗАВЕРШЕНИЕ 1–4 УРОВНЕЙ
  return (
    <div className={styles.lvl_complete_overlay}>
      <div className={styles.lvl_complete_card} style={{ width: '480px' }}>
        <div className={styles.lvl_complete_badge}>
          СЕКТОР {currentLevel} ЗАЧИЩЕН
        </div>

        <h2 className={styles.lvl_complete_title}>УРОВЕНЬ УСПЕШНО ПРОЙДЕН</h2>

        <RadioCommBox
          speakerKey="commander"
          badge="ОТЧЁТ ШТАБА"
          text={COMMANDER_VICTORY_LINES[currentLevel] || 'Рубеж удержан, командир!'}
        />

        <button
          type="button"
          onClick={handleNextClick}
          className={styles.supply_claim_btn}
          style={{ width: '100%', marginTop: '14px' }}
        >
          ДАЛЕЕ
        </button>
      </div>
    </div>
  );
};
