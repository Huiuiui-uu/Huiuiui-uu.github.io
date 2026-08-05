const SECTION_EPSILON = 3;
const WHEEL_GESTURE_END_DELAY = 100;
const TOUCH_GESTURE_THRESHOLD = 32;
const TRANSITION_DURATION = 600;

const normalizeWheelDelta = (event: WheelEvent) => event.deltaY * (
  event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? window.innerHeight
      : 1
);

class AboutPageTransitionController {
  private transitionActive = false;
  private wheelGestureActive = false;
  private wheelGestureConsumed = false;
  private wheelGestureEndTimer: number | undefined;
  private touchStartY: number | undefined;
  private touchLastY: number | undefined;
  private touchConsumed = false;

  constructor(
    private readonly header: HTMLElement,
    private readonly teamPanel: HTMLElement,
  ) {}

  init() {
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: true });
  }

  private getTeamTop = () => Math.max(0, this.teamPanel.offsetTop - this.header.offsetHeight);

  private beginWheelGesture() {
    if (!this.wheelGestureActive) {
      this.wheelGestureActive = true;
      this.wheelGestureConsumed = false;
    }

    window.clearTimeout(this.wheelGestureEndTimer);
    this.wheelGestureEndTimer = window.setTimeout(() => {
      this.resetWheelGesture();
    }, WHEEL_GESTURE_END_DELAY);
  }

  private resetWheelGesture() {
    window.clearTimeout(this.wheelGestureEndTimer);
    this.wheelGestureEndTimer = undefined;
    this.wheelGestureActive = false;
    this.wheelGestureConsumed = false;
  }

  private handleWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;

    const deltaY = normalizeWheelDelta(event);

    if (this.transitionActive) {
      event.preventDefault();
      return;
    }

    const teamTop = this.getTeamTop();
    const scrollY = window.scrollY;
    this.beginWheelGesture();

    if (this.wheelGestureConsumed) {
      event.preventDefault();
      return;
    }

    if (deltaY > 0 && scrollY < teamTop - SECTION_EPSILON) {
      event.preventDefault();
      this.wheelGestureConsumed = true;
      this.animateTo(teamTop);
      return;
    }

    if (deltaY > 0 && scrollY >= teamTop - SECTION_EPSILON) {
      event.preventDefault();
      this.wheelGestureConsumed = true;
      this.setScrollPosition(teamTop);
      return;
    }

    if (deltaY < 0 && scrollY >= teamTop - SECTION_EPSILON) {
      event.preventDefault();
      this.wheelGestureConsumed = true;
      this.animateTo(0);
    }
  };

  private handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    this.touchStartY = event.touches[0].clientY;
    this.touchLastY = this.touchStartY;
    this.touchConsumed = false;
  };

  private handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1 || this.touchStartY === undefined) return;

    const currentY = event.touches[0].clientY;
    const fingerDistance = currentY - this.touchStartY;
    const fingerStep = currentY - (this.touchLastY ?? this.touchStartY);
    const pageDirection = -Math.sign(fingerStep);
    const teamTop = this.getTeamTop();
    const scrollY = window.scrollY;
    this.touchLastY = currentY;

    if (this.transitionActive || this.touchConsumed) {
      event.preventDefault();
      return;
    }

    if (pageDirection > 0 && scrollY < teamTop - SECTION_EPSILON) {
      event.preventDefault();
      if (Math.abs(fingerDistance) < TOUCH_GESTURE_THRESHOLD) return;
      this.touchConsumed = true;
      this.animateTo(teamTop);
      return;
    }

    if (pageDirection > 0 && scrollY >= teamTop - SECTION_EPSILON) {
      event.preventDefault();
      this.touchConsumed = true;
      this.setScrollPosition(teamTop);
      return;
    }

    if (pageDirection < 0 && scrollY >= teamTop - SECTION_EPSILON) {
      event.preventDefault();
      if (Math.abs(fingerDistance) < TOUCH_GESTURE_THRESHOLD) return;
      this.touchConsumed = true;
      this.animateTo(0);
    }
  };

  private handleTouchEnd = () => {
    this.touchStartY = undefined;
    this.touchLastY = undefined;
    this.touchConsumed = false;
  };

  private animateTo(targetTop: number) {
    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.transitionActive = true;

    if (reduceMotion) {
      this.setScrollPosition(targetTop);
      this.transitionActive = false;
      return;
    }

    const startTime = performance.now();
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / TRANSITION_DURATION);
      const easedProgress = progress * progress * progress;
      window.scrollTo(0, startTop + distance * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }

      window.scrollTo(0, targetTop);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      this.transitionActive = false;
    };

    requestAnimationFrame(step);
  }

  private setScrollPosition(top: number) {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, top);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }
}

export const initAboutPageTransitions = () => {
  const header = document.querySelector<HTMLElement>('.site-header');
  const teamPanel = document.querySelector<HTMLElement>('.about-team-panel');
  if (!header || !teamPanel) return;

  new AboutPageTransitionController(header, teamPanel).init();
};
