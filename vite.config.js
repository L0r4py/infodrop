import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
    },
    plugins: [
      {
        name: 'local-api-config',
        configureServer(server) {
          server.middlewares.use('/api/config', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              supabaseUrl: env.SUPABASE_URL,
              supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              adminEmails: env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(',') : [],
              stripeLink: env.STRIPE_LINK || '',
              regionalSchemaEnabled: env.REGIONAL_SCHEMA_ENABLED === 'true'
            }));
          });
        }
      }
    ],
    build: {
      outDir: 'dist',
      copyPublicDir: true,
      rollupOptions: {
        input: {
          main: 'index.html',
          notfound: '404.html',
          pyreneesAlias: 'pyrénées/index.html'
        }
      }
    }
  };
});
