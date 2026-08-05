import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const PROJECT_CATEGORIES = [
  'All',
  'Masterplan',
  'Concept Development',
  'Commercial',
  'Hospitality',
  'Restaurant',
  'Hotel',
  'Workplace',
  'Mixed-Use',
  'Cultural',
  'Residential',
  'Others',
] as const;

interface ProjectConfig {
  year?: string | number;
  categories?: string[];
  tags?: string[];
}

interface ProjectTextConfig {
  title?: string;
  year?: string;
  categories?: string[];
  home?: boolean;
  intro?: string;
  website?: string;
  video?: string;
}

export interface ProjectAsset {
  folder: string;
  slug: string;
  title: string;
  year: string;
  types: string[];
  tags: string[];
  intro: string;
  website: string;
  video: string;
  cover: string;
  coverFrames: string[];
  coverAlt: string;
  gallery: Array<{ src: string; alt: string; frames: string[] }>;
  hasImage: boolean;
}

const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i;
const excludedImagePattern = /(archive|arcihve)/i;
const heroPattern = /^hero\.(avif|gif|jpe?g|png|webp)$/i;
const projectRoot = join(process.cwd(), 'public', 'images', 'projects');
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const slugOverrides: Record<string, string> = {
  '2016 Showcase Americana': 'americana',
  '2020 Angelo': 'angelo-house',
  '2021 Osiria Aqua Resort': 'osiria-aqua-resorts',
  '2023 Iki_Sunset': 'iki-sunset',
};

const titleOverrides: Record<string, string> = {
  '2016 Showcase Americana': 'Americana',
  '2020 Angelo': 'Angelo House',
  '2021 Osiria Aqua Resort': 'Osiria Aqua Resorts',
  '2023 Iki_Sunset': 'Iki Sunset',
};

const cleanTitle = (folder: string) => folder
  .replace(/^\d{4}[\s_-]*/, '')
  .replaceAll('_', ' ')
  .replace(/\s+/g, ' ')
  .trim();

const slugify = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

const inferType = (title: string) => {
  const value = title.toLowerCase();
  if (/hotel|resort|lounge|hospitality|kuta|paradise|phuket|aqua|iki/.test(value)) return 'Hospitality';
  if (/hq|headquarter|softbank|financial|office|workplace/.test(value)) return 'Workplace';
  if (/library|understage|pavilion|expo|cultural/.test(value)) return 'Cultural';
  if (/mixed use|mixed-use|seaport|multifamily/.test(value)) return 'Mixed-Use';
  if (/house|residence|residential|angelo/.test(value)) return 'Residential';
  if (/masterplan|village|island|s-hills|jamsil/.test(value)) return 'Masterplan';
  if (/concept|showcase|americana|offscale/.test(value)) return 'Concept Development';
  if (/flagship|shop|saks|gm |vino|haidilao|n naka|n soto/.test(value)) return 'Commercial';
  return 'Others';
};

const readProjectConfig = (folder: string): ProjectConfig => {
  const configPath = join(projectRoot, folder, 'project.json');
  if (!existsSync(configPath)) return {};

  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as ProjectConfig;
  } catch {
    return {};
  }
};

const readProjectTextConfig = (folder: string): ProjectTextConfig => {
  const textPath = join(projectRoot, folder, 'project.txt');
  if (!existsSync(textPath)) return {};

  const values: Record<string, string> = {};
  let activeField = '';
  readFileSync(textPath, 'utf8').replace(/\r\n/g, '\n').split('\n').forEach((line) => {
    if (activeField === 'intro') {
      values.intro = `${values.intro}${values.intro ? '\n' : ''}${line}`;
      return;
    }

    const match = line.match(/^(title|year|categories|home|website|video|intro):\s*(.*)$/i);
    if (!match) return;
    const [, field, value] = match;
    const key = field.toLowerCase();
    values[key] = value.trim();
    if (key === 'intro') activeField = key;
  });

  return {
    title: values.title,
    year: values.year,
    categories: values.categories?.split(',').map((category) => category.trim()).filter(Boolean),
    home: values.home === undefined ? undefined : /^(yes|true|1)$/i.test(values.home),
    intro: values.intro?.trim(),
    website: values.website,
    video: values.video,
  };
};

const assetPath = (folder: string, file: string) =>
  encodeURI(`/images/projects/${folder}/${file}`);

const numberedImagePattern = /^(\d+)(?:-(\d+))?\.(avif|gif|jpe?g|png|webp)$/i;

const getImageGroups = (files: string[]) => {
  const numbered = files.filter((file) => numberedImagePattern.test(file));
  if (numbered.length === 0) return [];

  const groups = new Map<number, string[]>();
  numbered.forEach((file) => {
    const match = file.match(numberedImagePattern);
    if (!match) return;
    const group = Number(match[1]);
    groups.set(group, [...(groups.get(group) ?? []), file]);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, groupFiles]) => groupFiles.sort((a, b) => {
      const aMatch = a.match(numberedImagePattern);
      const bMatch = b.match(numberedImagePattern);
      const aFrame = aMatch?.[2] === undefined ? 0 : Number(aMatch[2]);
      const bFrame = bMatch?.[2] === undefined ? 0 : Number(bMatch[2]);
      return aFrame - bFrame || collator.compare(a, b);
    }));
};

export const getProjectCatalog = (): ProjectAsset[] => readdirSync(projectRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const folder = entry.name;
    const config = readProjectConfig(folder);
    const textConfig = readProjectTextConfig(folder);
    const title = textConfig.title || titleOverrides[folder] || cleanTitle(folder);
    const slug = slugOverrides[folder] ?? slugify(cleanTitle(folder));
    const files = readdirSync(join(projectRoot, folder), { withFileTypes: true })
      .filter((file) => file.isFile() && imagePattern.test(file.name) && !excludedImagePattern.test(file.name))
      .map((file) => file.name)
      .sort(collator.compare);
    const numberedGroups = getImageGroups(files);
    const hero = files.find((file) => heroPattern.test(file)) ?? files[0];
    const heroGroup = numberedGroups.find((group) => group.includes(hero));
    const galleryGroups = [
      ...(textConfig.video ? numberedGroups : numberedGroups.filter((group) => group !== heroGroup)),
      ...files
        .filter((file) => file !== hero && !numberedImagePattern.test(file))
        .map((file) => [file]),
    ];
    const coverFrames = heroGroup?.map((file) => assetPath(folder, file))
      ?? (hero ? [assetPath(folder, hero)] : []);
    const types = (textConfig.categories ?? config.categories)?.filter((category) =>
      PROJECT_CATEGORIES.includes(category as typeof PROJECT_CATEGORIES[number]));
    const tags = textConfig.home === undefined
      ? config.tags?.map((tag) => tag.toLowerCase()) ?? []
      : textConfig.home ? ['home'] : [];

    return {
      folder,
      slug,
      title,
      year: String(textConfig.year ?? config.year ?? folder.match(/^\d{4}/)?.[0] ?? ''),
      types: types?.length ? types : [inferType(title)],
      tags,
      intro: textConfig.intro ?? '',
      website: textConfig.website ?? '',
      video: textConfig.video ?? '',
      cover: hero ? assetPath(folder, hero) : '/images/project-placeholder.svg',
      coverFrames,
      coverAlt: hero ? `${title} project` : `Image placeholder for ${title}`,
      gallery: galleryGroups.map((group, index) => ({
        src: assetPath(folder, group[0]),
        alt: `${title} project image ${index + 2}`,
        frames: group.map((file) => assetPath(folder, file)),
      })),
      hasImage: Boolean(hero),
    };
  })
  .sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title));
