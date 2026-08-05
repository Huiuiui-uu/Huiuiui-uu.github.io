const SECTION_EPSILON = 3;
const WHEEL_GESTURE_END_DELAY = 100;
const TOUCH_SCROLL_END_DELAY = 220;
const TOUCH_GESTURE_THRESHOLD = 32;
const TRANSITION_DURATION = 600;

interface HomeSections {
  landing: HTMLElement;
  header: HTMLElement;
  intro: HTMLElement;
  projects: HTMLElement;
}

interface SectionAnchors {
  landing: number;
  intro: number;
  projects: number;
}

const normalizeWheelDelta = (event: WheelEvent) => event.deltaY * (
  event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? window.innerHeight
      : 1
);

class HomePageTransitionController {
  private readonly listenerAbort = new AbortController();
  private transitionActive = false;
  private projectsLocked = false;
  private wheelGestureActive = false;
  private wheelGestureConsumed = false;
  private wheelStoppedAtProjectsTop = false;
  private wheelGestureEnteredProjects = false;
  private wheelDirection = 0;
  private wheelGestureEndTimer: number | undefined;
  private touchStartY: number | undefined;
  private touchLastY: number | undefined;
  private touchStartedInProjects = false;
  private touchConsumed = false;
  private touchStoppedAtProjectsTop = false;
  private touchDirection = 0;
  private touchGestureEndTimer: number | undefined;

  constructor(private readonly sections: HomeSections) {}

  init() {
    this.projectsLocked = window.scrollY >= this.getAnchors().projects - SECTION_EPSILON;
    const { signal } = this.listenerAbort;
    window.addEventListener('wheel', this.handleWheel, { passive: false, signal });
    window.addEventListener('scroll', this.handleScroll, { passive: true, signal });
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true, signal });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false, signal });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true, signal });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: true, signal });
  }

  destroy() {
    this.listenerAbort.abort();
    window.clearTimeout(this.wheelGestureEndTimer);
    window.clearTimeout(this.touchGestureEndTimer);
  }

  private getAnchors = (): SectionAnchors => ({
    landing: this.sections.landing.offsetTop,
    intro: this.sections.header.offsetTop,
    projects: this.sections.projects.offsetTop - this.sections.header.offsetHeight,
  });

  private beginWheelGesture(scrollY: number, projectsTop: number) {
    if (!this.wheelGestureActive) {
      this.wheelGestureActive = true;
      this.wheelGestureConsumed = false;
      this.wheelStoppedAtProjectsTop = false;
      this.wheelGestureEnteredProjects = scrollY > projectsTop + SECTION_EPSILON;
    } else if (scrollY > projectsTop + SECTION_EPSILON) {
      this.wheelGestureEnteredProjects = true;
    }

    this.scheduleWheelGestureReset();
  }

  private scheduleWheelGestureReset() {
    window.clearTimeout(this.wheelGestureEndTimer);
    this.wheelGestureEndTimer = window.setTimeout(this.resetWheelGesture, WHEEL_GESTURE_END_DELAY);
  }

  private resetWheelGesture = () => {
    window.clearTimeout(this.wheelGestureEndTimer);
    this.wheelGestureActive = false;
    this.wheelGestureConsumed = false;
    this.wheelStoppedAtProjectsTop = false;
    this.wheelGestureEnteredProjects = false;
    this.wheelDirection = 0;
  };

  private stopAtProjectsTop(projectsTop: number) {
    this.wheelGestureConsumed = true;
    this.wheelStoppedAtProjectsTop = true;
    this.setScrollPosition(projectsTop);
  }

  private handleWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;

    const deltaY = normalizeWheelDelta(event);

    if (this.transitionActive) {
      this.wheelGestureActive = true;
      this.wheelGestureConsumed = true;
      this.wheelDirection = Math.sign(deltaY);
      this.scheduleWheelGestureReset();
      event.preventDefault();
      return;
    }

    const anchors = this.getAnchors();
    const scrollY = window.scrollY;
    this.beginWheelGesture(scrollY, anchors.projects);
    this.wheelDirection = Math.sign(deltaY);

    if (
      !this.transitionActive
      && this.wheelGestureConsumed
      && this.wheelStoppedAtProjectsTop
      && deltaY > 0
    ) {
      this.wheelGestureConsumed = false;
      this.wheelStoppedAtProjectsTop = false;
    }

    if (this.wheelGestureConsumed) {
      event.preventDefault();
      return;
    }

    if (
      deltaY < 0
      && this.projectsLocked
      && scrollY >= anchors.projects - SECTION_EPSILON
    ) {
      event.preventDefault();
      const nextScrollY = Math.max(anchors.projects, scrollY + deltaY);
      if (nextScrollY <= anchors.projects + SECTION_EPSILON) {
        this.stopAtProjectsTop(anchors.projects);
      } else {
        this.setScrollPosition(nextScrollY);
      }
      return;
    }

    if (deltaY < 0 && this.wheelGestureEnteredProjects) {
      if (
        scrollY <= anchors.projects + SECTION_EPSILON
        || scrollY + deltaY <= anchors.projects + SECTION_EPSILON
      ) {
        event.preventDefault();
        this.stopAtProjectsTop(anchors.projects);
      }
      return;
    }

    const target = deltaY > 0
      ? this.getNextAnchor(scrollY, anchors)
      : this.getPreviousAnchor(scrollY, anchors);

    if (target === undefined) return;

    event.preventDefault();
    if (target === anchors.projects) this.projectsLocked = true;
    this.wheelGestureConsumed = true;
    this.animateTo(target);
  };

  private handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;

    const anchors = this.getAnchors();
    window.clearTimeout(this.touchGestureEndTimer);
    this.touchStartY = event.touches[0].clientY;
    this.touchLastY = this.touchStartY;
    this.touchStartedInProjects = window.scrollY > anchors.projects + SECTION_EPSILON;
    this.touchConsumed = false;
    this.touchStoppedAtProjectsTop = false;
    this.touchDirection = 0;
  };

  private handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1 || this.touchStartY === undefined) return;

    const anchors = this.getAnchors();
    const scrollY = window.scrollY;
    const currentY = event.touches[0].clientY;
    const fingerDistance = currentY - this.touchStartY;
    const fingerStep = currentY - (this.touchLastY ?? this.touchStartY);
    const pageDirection = -Math.sign(fingerStep);
    this.touchLastY = currentY;
    this.touchDirection = pageDirection;
    if (scrollY > anchors.projects + SECTION_EPSILON) {
      this.touchStartedInProjects = true;
    }

    if (
      !this.transitionActive
      && this.touchConsumed
      && this.touchStoppedAtProjectsTop
      && pageDirection > 0
    ) {
      this.touchConsumed = false;
      this.touchStoppedAtProjectsTop = false;
    }

    if (this.transitionActive || this.touchConsumed) {
      event.preventDefault();
      return;
    }

    if (
      pageDirection < 0
      && this.projectsLocked
      && scrollY >= anchors.projects - SECTION_EPSILON
    ) {
      event.preventDefault();
      const nextScrollY = Math.max(anchors.projects, scrollY - fingerStep);
      if (nextScrollY <= anchors.projects + SECTION_EPSILON) {
        this.touchConsumed = true;
        this.touchStoppedAtProjectsTop = true;
        this.setScrollPosition(anchors.projects);
      } else {
        this.setScrollPosition(nextScrollY);
      }
      return;
    }

    if (pageDirection < 0 && this.touchStartedInProjects) {
      if (scrollY <= anchors.projects + SECTION_EPSILON) {
        event.preventDefault();
        this.setScrollPosition(anchors.projects);
        this.touchConsumed = true;
        this.touchStoppedAtProjectsTop = true;
      }
      return;
    }

    const target = pageDirection > 0
      ? this.getNextAnchor(scrollY, anchors)
      : this.getPreviousAnchor(scrollY, anchors);

    if (target === undefined) return;

    event.preventDefault();
    if (Math.abs(fingerDistance) < TOUCH_GESTURE_THRESHOLD) return;

    if (target === anchors.projects) this.projectsLocked = true;
    this.touchConsumed = true;
    this.animateTo(target);
  };

  private handleTouchEnd = () => {
    this.touchStartY = undefined;
    this.touchLastY = undefined;
    this.scheduleTouchGestureEnd();
  };

  private handleScroll = () => {
    if (this.transitionActive) return;

    const projectsTop = this.getAnchors().projects;
    if (this.projectsLocked && window.scrollY < projectsTop - SECTION_EPSILON) {
      if (this.wheelGestureActive && this.wheelDirection < 0) {
        this.wheelGestureConsumed = true;
        this.wheelStoppedAtProjectsTop = true;
      }
      if (this.touchDirection < 0) {
        this.touchConsumed = true;
        this.touchStoppedAtProjectsTop = true;
      }
      this.setScrollPosition(projectsTop);
      return;
    }

    if (window.scrollY >= projectsTop - SECTION_EPSILON) {
      this.projectsLocked = true;
    }

    const wheelMustStop = (
      this.wheelGestureActive
      && !this.wheelGestureConsumed
      && this.wheelGestureEnteredProjects
      && this.wheelDirection < 0
    );
    const touchMustStop = (
      !this.touchConsumed
      && this.touchStartedInProjects
      && this.touchDirection < 0
    );

    if (
      window.scrollY <= projectsTop + SECTION_EPSILON
      && (wheelMustStop || touchMustStop)
    ) {
      if (wheelMustStop) {
        this.wheelGestureConsumed = true;
        this.wheelStoppedAtProjectsTop = true;
      }
      if (touchMustStop) {
        this.touchConsumed = true;
        this.touchStoppedAtProjectsTop = true;
      }
      this.setScrollPosition(projectsTop);
    }

    if (this.touchStartY === undefined && this.touchStartedInProjects) {
      this.scheduleTouchGestureEnd();
    }
  };

  private scheduleTouchGestureEnd() {
    window.clearTimeout(this.touchGestureEndTimer);
    this.touchGestureEndTimer = window.setTimeout(() => {
      this.touchStartedInProjects = false;
      this.touchConsumed = false;
      this.touchStoppedAtProjectsTop = false;
      this.touchDirection = 0;
    }, TOUCH_SCROLL_END_DELAY);
  }

  private getNextAnchor(scrollY: number, anchors: SectionAnchors) {
    if (scrollY < anchors.intro - SECTION_EPSILON) return anchors.intro;
    if (scrollY < anchors.projects - SECTION_EPSILON) return anchors.projects;
    return undefined;
  }

  private getPreviousAnchor(scrollY: number, anchors: SectionAnchors) {
    if (scrollY >= anchors.projects - SECTION_EPSILON) return anchors.intro;
    if (scrollY >= anchors.intro - SECTION_EPSILON) return anchors.landing;
    return undefined;
  }

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
    const previousScrollSnapType = document.documentElement.style.scrollSnapType;
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.scrollSnapType = 'none';

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
      document.documentElement.style.scrollSnapType = previousScrollSnapType;
      this.transitionActive = false;
    };

    requestAnimationFrame(step);
  }

  private setScrollPosition(top: number) {
    if (Math.abs(window.scrollY - top) < .5) return;

    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, top);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }
}

export const initHomePageTransitions = () => {
  const landing = document.querySelector<HTMLElement>('.landing-video');
  const header = document.querySelector<HTMLElement>('.site-header--home');
  const intro = document.querySelector<HTMLElement>('.home-intro-main');
  const projects = document.querySelector<HTMLElement>('.home-projects-main');

  if (!landing || !header || !intro || !projects) return;

  const homeWindow = window as Window & {
    __jaaxHomePageTransitionController?: HomePageTransitionController;
  };
  homeWindow.__jaaxHomePageTransitionController?.destroy();

  const controller = new HomePageTransitionController({ landing, header, intro, projects });
  homeWindow.__jaaxHomePageTransitionController = controller;
  controller.init();
};
