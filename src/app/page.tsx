"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { tarotDeck, TarotCard } from "../data/tarot";
import styles from "./page.module.css";

type AnimationPhase = 'idle' | 'shuffling' | 'moving-up' | 'spreading' | 'returning-cards' | 'gathering' | 'moving-down';

export default function Home() {
  const [deckState, setDeckState] = useState<TarotCard[]>(tarotDeck);
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Loading / image preload state
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Awakening the deck...');
  const [fadeOut, setFadeOut] = useState(false);
  const hasPreloaded = useRef(false);

  useEffect(() => {
    if (hasPreloaded.current) return;
    hasPreloaded.current = true;

    const allImages = [
      '/kosmic_bloom_logo.png',
      '/table-bg.png',
      '/arrow_left.png',
      '/arrow_right.png',
      ...tarotDeck.map(c => c.image),
    ];
    const total = allImages.length;
    let loaded = 0;

    const suitLabels: Record<number, string> = {
      0: 'Channeling the cosmos...',
      3: 'Summoning the Major Arcana...',
      25: 'Pouring the Cups...',
      39: 'Forging the Swords...',
      53: 'Igniting the Wands...',
      67: 'Unearthing the Pentacles...',
    };

    const updateProgress = () => {
      loaded++;
      const pct = Math.round((loaded / total) * 100);
      setLoadProgress(pct);
      if (suitLabels[loaded]) setLoadingText(suitLabels[loaded]);

      if (loaded >= total) {
        setLoadingText('The veil parts...');
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setIsLoading(false), 800);
        }, 600);
      }
    };

    allImages.forEach(src => {
      const img = new window.Image();
      img.onload = updateProgress;
      img.onerror = updateProgress;
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getRandomIndex = (max: number) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  };

  const shuffleDeck = useCallback((deck: TarotCard[]) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getRandomIndex(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const handleShuffleDeck = () => {
    if (phase !== 'idle') return;
    setPhase('shuffling');

    // Swap the cards in state while they are visually separated (midpoint of the 2s animation)
    setTimeout(() => {
      setDeckState(shuffleDeck([...deckState]));
    }, 1000);

    // Bring them back together after 2 full seconds
    setTimeout(() => {
      setPhase('idle');
    }, 2000);
  };

  const handleSpreadDeck = () => {
    if (phase !== 'idle') return;

    // 1. Shuffle animation first (lasts 2s)
    setPhase('shuffling');

    setTimeout(() => {
      setDeckState(shuffleDeck(tarotDeck));
    }, 1000);

    setTimeout(() => {
      setDrawnCards([]);
      setFocusedIndex(0);
      // 2. Shift whole deck to the start position (after 2s shuffle completes)
      setPhase('moving-up');
    }, 2000);

    // 3. Spread them downward
    setTimeout(() => {
      setPhase('spreading');
    }, 2600); // 2000ms + 600ms moving-up phase
  };

  const startGatherAnimation = () => {
    // Phase 1: Gather cards back to start position
    setPhase('gathering');

    // Phase 2: Shift whole deck back to center
    // Wait for the cascade to finish (78 * 15ms = 1170ms + 400ms transition = ~1600ms)
    setTimeout(() => {
      setPhase('moving-down');
    }, 1600);

    // Reset state once centered
    setTimeout(() => {
      setPhase('idle');
      setDeckState(tarotDeck);
      setDrawnCards([]);
      setFocusedIndex(0);
    }, 2200);
  };

  const handleGatherDeck = () => {
    if (drawnCards.length > 0) {
      // Pull drawn cards back into the deck first
      setPhase('returning-cards');
      setTimeout(() => {
        startGatherAnimation();
      }, 600);
    } else {
      startGatherAnimation();
    }
  };

  const drawCard = (specificIndex?: number) => {
    if (deckState.length === 0) return;
    const indexToDraw = specificIndex !== undefined ? specificIndex : getRandomIndex(deckState.length);
    const card = deckState[indexToDraw];
    const newDeck = [...deckState];
    newDeck.splice(indexToDraw, 1);
    setDeckState(newDeck);
    setDrawnCards((prev) => {
      const newDrawn = [...prev, card];
      setFocusedIndex(newDrawn.length - 1);
      return newDrawn;
    });
  };

  const CARD_SPACING = 14;
  const isSpread = phase === 'spreading' || phase === 'returning-cards' || phase === 'gathering';

  if (isLoading) {
    return (
      <main className={`${styles.container} ${styles.loadingScreen} ${fadeOut ? styles.loadingFadeOut : ''}`}>
        <div className={styles.ambientGlow}></div>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.loadingContent}>
          <Image src="/kosmic_bloom_logo.png" alt="Kosmic Bloom" width={180} height={180} className={styles.loadingLogo} unoptimized priority />
          <h1 className={`${styles.loadingTitle} golden-text cinzel`}>Kosmic Bloom Tarot</h1>
          <p className={styles.loadingSubtitle}>{loadingText}</p>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${loadProgress}%` }}></div>
          </div>
          <span className={styles.progressPct}>{loadProgress}%</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.ambientGlow}></div>
      <div className={styles.stars}></div>
      <div className={styles.twinkling}></div>

      <div className={styles.topBar}>
        <div className={styles.topLeftLogo}>
          <Image src="/kosmic_bloom_logo.png" alt="Kosmic Bloom Logo" width={120} height={120} className={styles.logo} unoptimized />
        </div>
        <div className={styles.rightSidebar}>
          <div className={styles.explainerPanel}>
            <h3 className={`${styles.explainerTitle} golden-text`}>The Mechanics of Fate</h3>
            <p className={styles.explainerBody}>
              This digital deck is governed by the Web Crypto API. By gathering entropy directly from your device&apos;s hardware state, every shuffle and draw is mathematically unpredictable and uniquely bound to the exact millisecond of your intention.
            </p>
          </div>
          <div className={styles.zoomControls}>
            <button className={`${styles.zoomBtn} cinzel`} onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))}>−</button>
            <span className={styles.zoomLabel}>{Math.round(zoomLevel * 100)}%</span>
            <button className={`${styles.zoomBtn} cinzel`} onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}>+</button>
          </div>
        </div>
      </div>

      <div className={styles.bottomLeftBranding}>
        <p className={styles.subtitle}>Fated Draws. True Randomness.</p>
      </div>

      <div className={styles.tableContent} style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
        <h1 className={`${styles.title} golden-text`}>Kosmic<br />Bloom<br />Tarot</h1>

        <div className={styles.deckArea}>
          {deckState.map((card, i) => {
            const totalCards = deckState.length;
            const totalSpreadHeight = Math.max(150, totalCards * CARD_SPACING);
            const startY = -(totalSpreadHeight / 2);

            let x = 0;
            let y = 0;
            let z = i * 1.5;
            let angle = isMobile ? 0 : 90;
            let delay = 0;

            if (phase === 'shuffling') {
              // Realistic Tarot "Wash" Shuffle (Scramble)
              // We use the card's ID to generate deterministic pseudo-random positions
              // This ensures cards stay in their chaotic spots when the array is randomized, 
              // and only their Z-index swaps smoothly.
              let hash = 0;
              const idStr = String(card.id);
              for (let k = 0; k < idStr.length; k++) {
                hash = idStr.charCodeAt(k) + ((hash << 5) - hash);
              }
              const rand1 = Math.abs(Math.sin(hash * 1.1)) * 10000;
              const rand2 = Math.abs(Math.cos(hash * 1.2)) * 10000;
              const r1 = rand1 - Math.floor(rand1);
              const r2 = rand2 - Math.floor(rand2);

              const radiusX = 80 + (r1 * 200); // Spread wide
              const radiusY = 60 + (r2 * 150); // Spread tall
              const theta = r2 * Math.PI * 2;

              x = Math.cos(theta) * radiusX;
              y = Math.sin(theta) * radiusY;
              angle = r1 * 360; // Chaotic rotation
              z = r2 * 20; // Flatten out the pile but keep slight depth variation

              delay = r1 * 200; // Stagger the explosive wash
            } else if (phase === 'moving-up') {
              y = startY;
              delay = 0;
            } else if (phase === 'spreading' || phase === 'returning-cards') {
              const t = i / Math.max(1, totalCards - 1);
              y = startY + (totalSpreadHeight * t);
              x = Math.pow(y / (totalSpreadHeight / 2), 2) * -80;
              angle = 90 + ((y / (totalSpreadHeight / 2)) * 12);
              delay = phase === 'spreading' ? (totalCards - 1 - i) * 15 : 0;
            } else if (phase === 'gathering') {
              y = startY;
              delay = (totalCards - 1 - i) * 15;
            } else if (phase === 'moving-down') {
              y = 0;
              delay = 0;
            }

            if (isMobile && isSpread) {
              const totalWidth = Math.max(200, totalCards * 6);
              const t = i / Math.max(1, totalCards - 1);
              x = -(totalWidth / 2) + (totalWidth * t);
              y = Math.pow(x / 100, 2) * 12;
              angle = -45 + (90 * t);
              delay = phase === 'spreading' ? (totalCards - 1 - i) * 15 : 0;
            }

            return (
              <div
                key={card.id}
                className={styles.cardBackWrapper}
                style={{
                  transform: `translateX(${x}px) translateY(${y}px) rotateZ(${angle}deg) translateZ(${z}px)`,
                  zIndex: i,
                  transitionDelay: `${delay}ms`
                }}
              >
                <div
                  className={styles.cardBack}
                  onClick={() => {
                    if (phase === 'spreading') drawCard(i);
                  }}
                >
                  <div className={styles.cardBackInner}>
                    <span className={`${styles.cardBackSymbol} cinzel`}>ॐ</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {drawnCards.length > 0 && (
          <div className={styles.drawnArea}>
            {drawnCards.map((card, index) => {
              const offset = index - focusedIndex;
              const isFocused = offset === 0;

              let translateZ = isFocused ? 0 : -350;
              let translateX = offset * 250;
              let rotateY = offset * -30;
              let opacity = Math.abs(offset) > 3 ? 0 : (isFocused ? 1 : 0.5);
              let zIndex = 100 - Math.abs(offset);
              let scale = 1;

              // Animate back into the deck area
              if (phase === 'returning-cards' || phase === 'gathering' || phase === 'moving-down') {
                translateX = -150; // Shift left towards the deck
                translateZ = -800; // Sink backwards
                rotateY = 0;
                scale = 0;         // Shrink to fit in the deck
                opacity = 0;       // Fade out
              }

              return (
                <div
                  key={`${card.id}-${index}`}
                  className={styles.drawnCardWrapper}
                  onClick={() => setFocusedIndex(index)}
                  style={{
                    transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    opacity, zIndex,
                    pointerEvents: Math.abs(offset) > 3 ? 'none' : 'auto',
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  <div className={styles.drawnCard}>
                    <Image src={card.image} alt={card.name} fill sizes="(max-width: 768px) 100vw, 600px" unoptimized />
                  </div>
                  <div className={styles.cardInfo} style={{ opacity: isFocused && phase === 'spreading' ? 1 : 0, transform: isFocused && phase === 'spreading' ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease' }}>
                    <h3 className={`${styles.cardName} golden-text`}>{card.name}</h3>
                    <span className={styles.cardSuit}>{card.arcana} {card.suit ? `• ${card.suit}` : ''}</span>
                  </div>
                </div>
              );
            })}

            {drawnCards.length > 1 && phase === 'spreading' && (
              <div className={styles.carouselControls}>
                {focusedIndex > 0 && (
                  <button className={`${styles.arrowBtn} cinzel`} onClick={() => setFocusedIndex(Math.max(0, focusedIndex - 1))}><Image src="/arrow_left.png" alt="Previous" width={96} height={96} unoptimized /></button>
                )}
                {focusedIndex < drawnCards.length - 1 && (
                  <button className={`${styles.arrowBtn} ${styles.arrowBtnRight} cinzel`} onClick={() => setFocusedIndex(Math.min(drawnCards.length - 1, focusedIndex + 1))}><Image src="/arrow_right.png" alt="Next" width={96} height={96} unoptimized /></button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.bottomRightControls}>
        {phase === 'idle' ? (
          <>
            <button className="btn-primary glass-panel" onClick={handleShuffleDeck}>Shuffle Deck</button>
            <button className="btn-primary glass-panel" onClick={handleSpreadDeck}>Spread the Deck</button>
          </>
        ) : (
          <>
            <button className="btn-primary glass-panel" onClick={() => drawCard()} disabled={phase !== 'spreading'}>Pull Random Card</button>
            <button className="btn-primary glass-panel" onClick={handleGatherDeck} disabled={phase !== 'spreading'}>Gather Deck</button>
          </>
        )}
      </div>
    </main>
  );
}
