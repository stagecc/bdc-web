import { getCollection } from 'astro:content';

export const prerender = true;
export async function GET() {
  const [fellows, publications] = await Promise.all([
    getCollection('fellows'),
    getCollection('publications'),
  ]);
  return Response.json({
    fellows: fellows.map(({ data }) => data),
    publications: publications.map(({ data }) => data),
  });
}
