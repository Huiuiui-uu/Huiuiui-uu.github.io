const PORTRAIT_RATIO_THRESHOLD = 1;

export const setupProjectGalleryOverlap = (grid: HTMLElement) => {
  let frame = 0;

  const sync = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rows = Array.from(grid.querySelectorAll<HTMLElement>('.project-gallery-row'));

      rows.forEach((row) => row.classList.remove('is-portrait', 'overlaps-next'));

      rows.forEach((row) => {
        const image = row.querySelector<HTMLImageElement>('img');
        if (!image?.complete || image.naturalWidth === 0) return;

        const isPortrait = image.naturalHeight / image.naturalWidth > PORTRAIT_RATIO_THRESHOLD;
        if (!isPortrait) return;

        row.classList.add('is-portrait', 'overlaps-next');
      });
    });
  };

  grid.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement) sync();
  }, true);

  sync();
  return sync;
};
