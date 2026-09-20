export function triggerCelebration() {
  if (typeof window === 'undefined') return;
  try {
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default || confettiModule;
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'],
      });
    });
  } catch (e) {
    console.error('Confetti error:', e);
  }
}
