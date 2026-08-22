import type { Transition, Variants } from 'motion/react';

export type SpringTransition = Transition & {
  type: 'spring';
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
  duration?: number;
};

export type EaseTransition = Transition & {
  type: 'tween';
  ease?: string | number[];
  duration?: number;
};

export type InertiaTransition = Transition & {
  type: 'inertia';
  velocity?: number;
  power?: number;
  timeConstant?: number;
  modifyTarget?: (v: number) => number;
  min?: number;
  max?: number;
  bounceStiffness?: number;
  bounceDamping?: number;
  restDelta?: number;
};

export type MotionTransition = SpringTransition | EaseTransition | InertiaTransition | Transition;

export type MotionVariants = Variants & {
  [key: string]: {
    transition?: MotionTransition;
  } | boolean;
};

const spring = (stiffness = 300, damping = 30, mass = 1): SpringTransition => ({
  type: 'spring',
  stiffness,
  damping,
  mass,
});

export const springFast = spring(500, 35);
export const springNormal = spring(400, 35);
export const springSlow = spring(300, 30);
export const springBouncy = spring(300, 25);
export const springGentle = spring(200, 20);

const tween = (duration = 0.3, ease: 'easeIn' | 'easeOut' | 'easeInOut' | 'circIn' | 'circOut' | 'circInOut' | 'backIn' | 'backOut' | 'backInOut' = 'easeOut'): EaseTransition => ({
  type: 'tween',
  duration,
  ease,
});

export const transitions = {
  spring: spring,
  springFast,
  springNormal,
  springSlow,
  springBouncy,
  springGentle,
  tween: tween,
  fast: tween(0.15, 'easeOut'),
  normal: tween(0.25, 'easeOut'),
  slow: tween(0.35, 'easeOut'),
} as const;

export const staggerContainer = (staggerChildren = 0.05, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren, delayChildren },
  },
});

export const fadeIn = (delay = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, delay } },
});

export const slideUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 35, delay } },
});

export const slideDown = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 35, delay } },
});

export const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 35, delay } },
});

export const itemStagger = (index: number, baseDelay = 0, step = 0.05): Variants => ({
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 35, delay: baseDelay + index * step } },
});

export const hoverScale = (scale = 1.05): Variants => ({
  whileHover: { scale },
  whileTap: { scale: 0.95 },
});

export const hoverLift = (y = -4): Variants => ({
  whileHover: { y },
  whileTap: { scale: 0.98 },
});

export type { Transition, Variants } from 'motion/react';