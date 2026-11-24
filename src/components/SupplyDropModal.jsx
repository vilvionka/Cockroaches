import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import styles from '../App.module.css';

const LOOT_POOL = [
  // Обычные (бирюзовые)
  {
    id: 'gold_100',
    rarity: 'common',
    rarityLabel: 'СТАНДАРТНЫЙ ГРУЗ',
    icon: '💰',
    title: '+100 КРЕДИТОВ',
    desc: 'Дополнительное финансирование сектора',
    reward: { type: 'gold', amount: 100 }
  },
  {
    id: 'boosts_df',
    rarity: 'common',
    rarityLabel: 'СТАНДАРТНЫЙ ГРУЗ',
    icon: '⚡',
    title: 'НАБОР УСИЛИТЕЛЕЙ',
    desc: '+1 Урон (D) и +1 Скорострельность (F)',
    reward: { type: 'boosts', damage: 1, fireRate: 1, range: 0 }
  },
  {
    id: 'base_hp_20',
    rarity: 'common',
    rarityLabel: 'СТАНДАРТНЫЙ ГРУЗ',
    icon: '🛡️',
    title: '+20 ПРОЧНОСТИ БАЗЫ',
    desc: 'Усиление энергетического купола',
    reward: { type: 'baseHp', amount: 20, }
  },

  // Редкие (фиолетовые) — везде + усилители
  {
    id: 'limit_gun',
    rarity: 'rare',
    rarityLabel: 'РЕДКИЙ КОНТРАКТ',
    icon: '🔫',
    title: '+1 ПУЛЕМЁТ И УСИЛИТЕЛИ',
    desc: '+1 к лимиту Пулемётов, +1 Урон (D) и +1 Скорость (F)',
    reward: { type: 'towerLimit', tower: 'gun', amount: 1, boosts: { damage: 1, fireRate: 1, range: 0 } }
  },
  {
    id: 'limit_frost',
    rarity: 'rare',
    rarityLabel: 'РЕДКИЙ КОНТРАКТ',
    icon: '❄️',
    title: '+1 ЗАМОРОЗКА И УСИЛИТЕЛИ',
    desc: '+1 к лимиту Заморозки, +1 Радиус (R) и +1 Скорость (F)',
    reward: { type: 'towerLimit', tower: 'frost', amount: 1, boosts: { damage: 0, fireRate: 1, range: 1 } }
  },
  {
    id: 'gold_200',
    rarity: 'rare',
    rarityLabel: 'РЕДКИЙ КОНТРАКТ',
    icon: '💎',
    title: '+200 КРЕДИТОВ И УСИЛИТЕЛИ',
    desc: 'Крупный транш + по 1 усилителю Урона (D) и Радиуса (R)',
    reward: { type: 'gold', amount: 200, boosts: { damage: 1, fireRate: 0, range: 1 } }
  },
  {
    id: 'boosts_all',
    rarity: 'rare',
    rarityLabel: 'РЕДКИЙ КОНТРАКТ',
    icon: '🔋',
    title: 'ДВОЙНОЙ БОЕКОМПЛЕКТ',
    desc: 'По +2 усилителя каждого типа (D, F, R)',
    reward: { type: 'boosts', damage: 2, fireRate: 2, range: 2 }
  },

  // Легендарные / Джекпот (золотые) — везде + полный набор усилителей
  {
    id: 'limit_bomb_gold',
    rarity: 'legendary',
    rarityLabel: 'ДЖЕКПОТ СНАБЖЕНИЯ',
    icon: '💣',
    title: '+1 БОМБАРДА, +100 КР. И БУСТЫ',
    desc: 'Доп. Бомбарда, 100 кр. и по +1 усилителю (D, F, R)',
    reward: { type: 'comboBomb', tower: 'bomb', amount: 1, gold: 100, boosts: { damage: 1, fireRate: 1, range: 1 } }
  },
  {
    id: 'gold_350',
    rarity: 'legendary',
    rarityLabel: 'ДЖЕКПОТ СНАБЖЕНИЯ',
    icon: '👑',
    title: '+350 КРЕДИТОВ И МЕГА-БУСТЫ',
    desc: 'Максимальный бюджет и по +2 усилителя (D, F, R)',
    reward: { type: 'gold', amount: 350, boosts: { damage: 2, fireRate: 2, range: 2 } }
  }

];

const rollOneItem = (excludeIds = []) => {
  const roll = Math.random();
  let targetRarity = 'common';
  if (roll > 0.85) targetRarity = 'legendary';
  else if (roll > 0.52) targetRarity = 'rare';

  const candidates = LOOT_POOL.filter(
    (item) => item.rarity === targetRarity && !excludeIds.includes(item.id)
  );
  const pool = candidates.length > 0 ? candidates : LOOT_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
};

const generateThreeCases = () => {
  const result = [];
  const usedIds = [];
  for (let i = 0; i < 3; i++) {
    const item = rollOneItem(usedIds);
    usedIds.push(item.id);
    result.push(item);
  }
  return result;
};

export const SupplyDropModal = () => {
  const isOpen = useGameStore((state) => state.isSupplyDropOpen);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const claimSupplyDrop = useGameStore((state) => state.claimSupplyDrop);

  const [cases, setCases] = useState([]);
  const [pickedIndex, setPickedIndex] = useState(null);
  const [revealOthers, setRevealOthers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCases(generateThreeCases());
      setPickedIndex(null);
      setRevealOthers(false);
    }
  }, [isOpen, currentLevel]);

  if (!isOpen || cases.length < 3) return null;

  const handlePickCase = (index) => {
    if (pickedIndex !== null) return;
    setPickedIndex(index);

    // Через 450 мс приоткрываем остальные кейсы, чтобы показать, что в них было
    setTimeout(() => {
      setRevealOthers(true);
    }, 450);
  };

  const handleConfirm = () => {
    if (pickedIndex === null) return;
    claimSupplyDrop(cases[pickedIndex].reward);
  };

  return (
    <div className={styles.supply_overlay}>
      <div className={styles.supply_modal} style={{ backgroundImage: "url('./drop.jpg')" }}>
        <div className={styles.lvl_complete_badge}>СЕКТОР {currentLevel} // ОРБИТАЛЬНЫЙ СБРОС</div>
        <h2 className={styles.supply_title}>ВЫБЕРИТЕ КОНТЕЙНЕР СНАБЖЕНИЯ</h2>
        <p className={styles.supply_subtitle}>
          {pickedIndex === null
            ? 'В каждом контейнере зашифрованы кредиты, усилители или доп. лимиты на башни'
            : 'Контейнер вскрыт! Заберите груз и приступайте к развёртыванию'}
        </p>

        <div className={styles.supply_grid}>
          {cases.map((item, idx) => {
            const isPicked = pickedIndex === idx;
            const isMissed = pickedIndex !== null && !isPicked && revealOthers;
            const isOpened = isPicked || isMissed;

            return (
              <button
                key={idx}
                type="button"
                disabled={pickedIndex !== null}
                onClick={() => handlePickCase(idx)}
                className={styles.supply_card}
                data-rarity={isOpened ? item.rarity : 'closed'}
                data-picked={isPicked}
                data-missed={isMissed}
              >
                {!isOpened ? (
                  <div className={styles.supply_closed_body}>
                    <img
                      src="./supply_box.png"
                      alt={`Капсула 0${idx + 1}`}
                      className={styles.supply_box_icon}
                    />
                    <div className={styles.supply_box_code}>КАПСУЛА 0{idx + 1}</div>
                    <div className={styles.supply_box_hint}>НАЖМИТЕ ДЛЯ ВСКРЫТИЯ</div>
                  </div>
                ) : (
                  <div className={styles.supply_opened_body}>
                    <span className={styles.supply_status_tag}>
                      {isPicked ? 'ПОЛУЧЕНО' : 'В ДРУГОМ КЕЙСЕ'}
                    </span>
                    <div className={styles.supply_rarity}>{item.rarityLabel}</div>
                    <div className={styles.supply_reward_icon}>{item.icon}</div>
                    <div className={styles.supply_reward_title}>{item.title}</div>
                    <div className={styles.supply_reward_desc}>{item.desc}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {pickedIndex !== null && (
          <button
            type="button"
            onClick={handleConfirm}
            className={styles.supply_claim_btn}
          >
            ЗАБРАТЬ И НАЧАТЬ ОБОРОНУ
          </button>
        )}
      </div>
    </div>
  );
};
