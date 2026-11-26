import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RadioCommBox } from './RadioCommBox';
import { COMMANDER_UNLOCK_LINES } from '../store/storyData';
import styles from '../App.module.css';

export const UnlockWeaponModal = () => {
  const weaponInfo = useGameStore((state) => state.unlockedWeaponModal);
  const closeUnlockWeaponModal = useGameStore((state) => state.closeUnlockWeaponModal);

  if (!weaponInfo) return null;

  return (
    <div className={styles.supply_overlay} style={{ zIndex: 62 }}>
      <div className={styles.supply_modal} style={{ width: '440px' }}>
        <RadioCommBox
          speakerKey="commander"
          badge={`СЕКТОР ${weaponInfo.level} // НОВОЕ ВООРУЖЕНИЕ`}
          text={COMMANDER_UNLOCK_LINES[weaponInfo.level] || weaponInfo.description}
        />



        <h2 className={styles.supply_title}>{weaponInfo.name}</h2>

        <div
          className={styles.supply_img}
          style={{
            width: '96px',
            height: '96px',
            margin: '10px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, rgba(6, 12, 20, 0.9) 75%)',
            border: '1px solid #00e5ff',
            borderRadius: '6px',
            boxShadow: '0 0 22px rgba(0, 229, 255, 0.35)'
          }}
        >
          <img
            src={weaponInfo.image}
            alt={weaponInfo.name}
            style={{ width: '74px', height: '74px', objectFit: 'contain' }}
          />
        </div>

        <div className={styles.emergency_specs} style={{ flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
          {weaponInfo.stats.map((st, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{st.label}:</span>
              <b>{st.value}</b>
            </div>
          ))}
        </div>



        <button
          type="button"
          onClick={closeUnlockWeaponModal}
          className={styles.supply_claim_btn}
          style={{ width: '100%' }}
        >
          ДАЛЕЕ
        </button>
      </div>
    </div>
  );
};
