const TRANSITION_DURATION = 900;
const FADE_OUT_DURATION = 480;
const HOLD_DURATION = 180;

const cssPixels = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const detailHeroRect = (image: HTMLImageElement) => {
  const rootStyle = getComputedStyle(document.documentElement);
  const pageX = cssPixels(rootStyle.getPropertyValue('--page-x'));
  const gap = cssPixels(rootStyle.getPropertyValue('--project-gallery-row-gap'), 16);
  const rem = cssPixels(rootStyle.fontSize, 16);
  const sourceRect = image.getBoundingClientRect();
  const aspectRatio = image.naturalWidth && image.naturalHeight
    ? image.naturalWidth / image.naturalHeight
    : sourceRect.width / sourceRect.height;

  if (window.matchMedia('(max-width: 800px)').matches) {
    const width = window.innerWidth - (pageX * 2);
    return {
      left: pageX,
      top: (7 * rem) + 1 + gap,
      width,
      height: width / aspectRatio,
    };
  }

  const gridWidth = window.innerWidth - (pageX * 2);
  const columnWidth = (gridWidth - (11 * gap)) / 12;
  const mediaLeft = pageX + (2 * (columnWidth + gap));
  const mediaWidth = (6 * columnWidth) + (5 * gap);
  const mastheadHeight = Math.min(11 * rem, Math.max(8 * rem, window.innerHeight * 0.16));
  const width = mediaWidth - gap;

  return {
    left: mediaLeft + gap,
    top: mastheadHeight + 1 + gap,
    width,
    height: width / aspectRatio,
  };
};

const supportsCrossDocumentViewTransitions = () =>
  CSS.supports('view-transition-name: project-hero') && 'onpageswap' in window;

export const setupProjectPageTransitions = () => {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[data-project-transition]');
  let isNavigating = false;
  let returnCleanupTimer = 0;
  let returnTransitionActive = false;

  const clearTransitionNames = () => {
    links.forEach((projectLink) => {
      projectLink.querySelector<HTMLElement>('figure')?.style.removeProperty('view-transition-name');
    });
    isNavigating = false;
  };

  const restoreReturnPosition = () => {
    const returnSlug = document.documentElement.dataset.projectReturn
      ?? new URLSearchParams(window.location.search).get('return');
    if (!returnSlug) return;

    const targetPath = `/projects/${returnSlug}`;
    const targetLink = Array.from(links).find((projectLink) =>
      new URL(projectLink.href, window.location.href).pathname === targetPath);
    const targetFigure = targetLink?.querySelector<HTMLElement>('figure');
    if (!targetFigure) return;

    const savedFigureTop = Number.parseFloat(document.documentElement.dataset.projectReturnTop ?? '');
    const savedScrollY = Number.parseFloat(document.documentElement.dataset.projectReturnScrollY ?? '');
    const targetDocumentTop = window.scrollY + targetFigure.getBoundingClientRect().top;
    const restoredScrollY = Number.isFinite(savedFigureTop)
      ? targetDocumentTop - savedFigureTop
      : savedScrollY;

    if (!Number.isFinite(restoredScrollY)) return;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, restoredScrollY));
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  };

  const prepareReturnTransition = () => {
    const returnSlug = document.documentElement.dataset.projectReturn
      ?? new URLSearchParams(window.location.search).get('return');
    if (!returnSlug) return false;

    clearTransitionNames();

    const targetPath = `/projects/${returnSlug}`;
    const targetLink = Array.from(links).find((projectLink) =>
      new URL(projectLink.href, window.location.href).pathname === targetPath);
    const targetFigure = targetLink?.querySelector<HTMLElement>('figure');
    if (!targetFigure) return false;

    document.documentElement.classList.add('project-return-transition');
    document.documentElement.dataset.projectReturn = returnSlug;
    targetFigure.style.viewTransitionName = 'project-hero';
    returnTransitionActive = true;
    window.history.scrollRestoration = 'manual';
    restoreReturnPosition();

    if (window.location.search) {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    }
    window.clearTimeout(returnCleanupTimer);
    returnCleanupTimer = window.setTimeout(() => {
      returnTransitionActive = false;
      document.documentElement.classList.remove('project-return-transition');
      delete document.documentElement.dataset.projectReturn;
      delete document.documentElement.dataset.projectReturnScrollY;
      delete document.documentElement.dataset.projectReturnTop;
      clearTransitionNames();
    }, 1700);
    return true;
  };

  if (!prepareReturnTransition()) clearTransitionNames();
  window.addEventListener('pageshow', () => {
    if (returnTransitionActive) {
      restoreReturnPosition();
      window.requestAnimationFrame(restoreReturnPosition);
      return;
    }
    if (!prepareReturnTransition()) clearTransitionNames();
  });

  links.forEach((link) => link.addEventListener('click', (event) => {
    if (isNavigating || event.defaultPrevented || event.button !== 0
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || link.target === '_blank') return;

    const sourceFigure = link.querySelector<HTMLElement>('figure');
    const sourceImage = sourceFigure?.querySelector<HTMLImageElement>('img');
    if (!sourceFigure || !sourceImage) return;

    const source = sourceFigure.getBoundingClientRect();
    const destination = new URL(link.href, window.location.href);
    destination.searchParams.set('fromY', String(Math.round(window.scrollY)));
    destination.searchParams.set('fromTop', source.top.toFixed(2));
    destination.searchParams.set('from', window.location.pathname === '/' ? 'home' : 'work');
    const activeFilter = new URLSearchParams(window.location.search).get('filter');
    if (activeFilter) destination.searchParams.set('filter', activeFilter);
    link.href = destination.href;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.remove('project-return-transition');
    clearTransitionNames();
    sourceFigure.style.viewTransitionName = 'project-hero';
    if (supportsCrossDocumentViewTransitions()) {
      event.preventDefault();
      isNavigating = true;
      document.documentElement.getBoundingClientRect();
      window.requestAnimationFrame(() => window.location.assign(destination.href));
      return;
    }
    if (!sourceImage.complete) return;

    event.preventDefault();
    isNavigating = true;

    const target = detailHeroRect(sourceImage);
    const overlay = document.createElement('figure');
    const overlayImage = document.createElement('img');

    overlay.className = 'project-transition-hero';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.left = `${target.left}px`;
    overlay.style.top = `${target.top}px`;
    overlay.style.width = `${target.width}px`;
    overlay.style.height = `${target.height}px`;

    overlayImage.src = sourceImage.currentSrc || sourceImage.src;
    overlayImage.alt = '';
    overlay.append(overlayImage);
    document.body.append(overlay);
    document.body.classList.add('project-exit-active');

    const translateX = source.left - target.left;
    const translateY = source.top - target.top;
    const scaleX = source.width / target.width;
    const scaleY = source.height / target.height;
    const animation = overlay.animate([
      { transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})` },
      { transform: 'translate(0, 0) scale(1, 1)' },
    ], {
      duration: TRANSITION_DURATION,
      delay: FADE_OUT_DURATION + HOLD_DURATION,
      easing: 'cubic-bezier(.22, .72, .18, 1)',
      fill: 'forwards',
    });

    const navigate = () => window.location.assign(destination.href);
    animation.finished.then(navigate, navigate);
  }));
};
