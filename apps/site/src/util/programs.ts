import { type CollectionEntry, getCollection } from 'astro:content';

export interface ProgramWithContent {
  program: CollectionEntry<'programs'>;
  local?: CollectionEntry<'programContent'>;
  title: string;
  excerpt?: string;
  priority?: number;
  dataAvailable: boolean;
}

export async function getProgramsWithContent(): Promise<ProgramWithContent[]> {
  const programs = await getCollection('programs');
  const localEntries = await getCollection('programContent');
  const localById = new Map(localEntries.map((entry) => [entry.id, entry]));

  return programs.map((program) => {
    const local = localById.get(program.id);

    return {
      program,
      local,
      title: local?.data.title ?? program.data.name,
      excerpt: local?.data.excerpt,
      priority: local?.data.priority,
      dataAvailable: local?.data.dataAvailable !== false,
    };
  });
}

export function sortProgramsForDisplay(
  a: ProgramWithContent,
  b: ProgramWithContent,
): number {
  if (a.priority !== undefined && b.priority !== undefined) {
    return a.priority - b.priority;
  }

  if (a.priority !== undefined) {
    return -1;
  }

  if (b.priority !== undefined) {
    return 1;
  }

  return a.title.localeCompare(b.title);
}
