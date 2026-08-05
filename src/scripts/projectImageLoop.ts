const FRAME_INTERVAL = 2600;
const CROSSFADE_DURATION = 520;

const parseFrames = (value: string | undefined) => {
  if (!value) return [];
  try {
    const frames = JSON.parse(value);
    return Array.isArray(frames) ? frames.filter((frame): frame is string => typeof frame === 'string') : [];
  } catch {
    return [];
  }
};

const waitForImage = (image: HTMLImageElement) => {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  });
};

export const setupProjectImageLoops = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll<HTMLImageElement>('[data-image-loop]').forEach((image) => {
    if (image.dataset.imageLoopReady === 'true') return;
    const frames = parseFrames(image.dataset.imageLoop);
    const figure = image.parentElement;
    if (frames.length < 2 || !figure) return;

    image.dataset.imageLoopReady = 'true';
    figure.classList.add('has-image-loop');
    image.classList.add('is-active');

    const alternate = image.cloneNode(false) as HTMLImageElement;
    alternate.removeAttribute('data-image-loop');
    alternate.removeAttribute('data-image-loop-ready');
    alternate.className = 'image-loop-layer';
    alternate.alt = '';
    alternate.setAttribute('aria-hidden', 'true');
    figure.append(alternate);

    frames.slice(1).forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    let frameIndex = 0;
    let visibleImage: HTMLImageElement = image;
    let hiddenImage: HTMLImageElement = alternate;
    let timer: number | undefined;
    let isChanging = false;

    const advance = async () => {
      if (isChanging) return;
      isChanging = true;

      const nextFrameIndex = (frameIndex + 1) % frames.length;
      hiddenImage.src = frames[nextFrameIndex];
      await waitForImage(hiddenImage);

      try {
        await hiddenImage.decode();
      } catch {
        // The browser will still render the image when it becomes available.
      }

      hiddenImage.classList.add('is-top');
      requestAnimationFrame(() => hiddenImage.classList.add('is-active'));

      window.setTimeout(() => {
        visibleImage.classList.remove('is-active', 'is-top');
        frameIndex = nextFrameIndex;
        [visibleImage, hiddenImage] = [hiddenImage, visibleImage];
        isChanging = false;
      }, CROSSFADE_DURATION);
    };

    const start = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(advance, FRAME_INTERVAL);
    };
    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    }, { threshold: 0.1 });
    observer.observe(image);
  });
};
