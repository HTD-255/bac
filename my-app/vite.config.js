export default {
  base: '/',
  build: {
    sourcemap: true,
    },
  server: {
    middlewareMode: false,
    fs: {
      strict: false
    },
    // Thêm cấu hình rewrite cho đường dẫn /login
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/login') {
          req.url = '/login.html';
        }
        next();
      });
    }
  }
}
