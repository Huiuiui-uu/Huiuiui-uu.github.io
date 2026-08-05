const BOTTOM_EPSILON = 2;

const normalizeWheelDelta = (event: WheelEvent) => event.deltaY * (
  event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? window.innerHeight
      : 1
);

export const setupBottomScrollLock = (scrollContainer?: HTMLElement) => {
  const getScrollTop = () => scrollContainer ? scrollContainer.scrollTop : window.scrollY;
  const getMaxScrollTop = () => scrollContainer
    ? Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight)
    : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const setScrollTop = (top: number) => {
    if (scrollContainer) scrollContainer.scrollTop = top;
    else window.scrollTo(0, top);
  };
  const isAtBottom = () => getScrollTop() >= getMaxScrollTop() - BOTTOM_EPSILON;
  let lastTouchY: number | undefined;

  window.addEventListener('wheel', (event) => {
    if (normalizeWheelDelta(event) <= 0 || !isAtBottom()) return;
    event.preventDefault();
    setScrollTop(getMaxScrollTop());
  }, { passive: false });

  window.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) lastTouchY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 1 || lastTouchY === undefined) return;
    const currentY = event.touches[0].clientY;
    const movingDownPage = currentY < lastTouchY;
    lastTouchY = currentY;
    if (!movingDownPage || !isAtBottom()) return;
    event.preventDefault();
    setScrollTop(getMaxScrollTop());
  }, { passive: false });

  window.addEventListener('touchend', () => { lastTouchY = undefined; }, { passive: true });
  window.addEventListener('touchcancel', () => { lastTouchY = undefined; }, { passive: true });
};
