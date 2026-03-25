import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'tienda/producto/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => []
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
