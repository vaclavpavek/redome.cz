import type { APIRoute } from 'astro';

const sha = (import.meta.env.PUBLIC_GIT_SHA ?? 'local-dev').slice(0, 12);
const branch = import.meta.env.PUBLIC_GIT_BRANCH ?? 'local';
const repo = 'https://github.com/vaclavpavek/redome.cz';

export const GET: APIRoute = () => {
  const body = [
    `branch=${branch}`,
    `sha=${sha}`,
    `commit=${import.meta.env.PUBLIC_GIT_SHA ?? 'local-dev'}`,
    `repo=${repo}`,
    `commit_url=${repo}/commit/${import.meta.env.PUBLIC_GIT_SHA ?? 'local-dev'}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
