import React from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

export const GoldPanel = () => {
  const gold = useGameStore((state) => state.gold);
  const boostsInventory = useGameStore((state) => state.boostsInventory);
  const selectedTowerId = useGameStore((state) => state.selectedTowerId);

  if (selectedTowerId) return null;

  return (
    <div className={styles.bar_gold_panel}>
      <div className={styles.bar_gold_row}>
        <span className={styles.gold_label}>КРЕДИТЫ</span>
        <span className={styles.gold_value}>{gold}</span>
      </div>

      <div className={styles.boosts_info_bar}>
        <div className={styles.boost_info_item} title="Усилители урона">
          <span className={styles.boost_dot} style={{ backgroundColor: '#FF5252' }}>D</span>
          <span className={styles.boost_val}>x{boostsInventory.damage}</span>
        </div>
        <div className={styles.boost_info_item} title="Усилители скорострельности">
          <span className={styles.boost_dot} style={{ backgroundColor: '#FF9800' }}>F</span>
          <span className={styles.boost_val}>x{boostsInventory.fireRate}</span>
        </div>
        <div className={styles.boost_info_item} title="Усилители радиуса">
          <span className={styles.boost_dot} style={{ backgroundColor: '#00e5ff' }}>R</span>
          <span className={styles.boost_val}>x{boostsInventory.range}</span>
        </div>
      </div>
    </div>
  );
};
