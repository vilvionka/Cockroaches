import React from 'react';
import { CHARACTERS } from '../store/storyData';
import styles from '../App.module.css';

export const RadioCommBox = ({ speakerKey = 'commander', badge, text, alertMode = false }) => {
  const char = CHARACTERS[speakerKey] || CHARACTERS.commander;

  return (
    <div className={styles.radio_box} data-alert={alertMode}>
      {/* Левая колонка: позывной и реплика */}
      <div className={styles.radio_text_col}>
        <div className={styles.radio_header_line}>
          <span className={styles.radio_dot} />
          <span className={styles.radio_speaker}>{char.name}</span>
          <span className={styles.radio_role}>// {badge || char.role}</span>
        </div>
        <p className={styles.radio_message}>{text}</p>
      </div>

      {/* Правая колонка: портрет без фона с эффектом радиопомех */}
      <div className={styles.radio_avatar_wrap}>
        <div className={styles.radio_static_bg} />
        <img
          src={char.avatar}
          alt={char.name}
          className={styles.radio_avatar_img}
        />
        <div className={styles.radio_scanlines} />
      </div>
    </div>
  );
};
