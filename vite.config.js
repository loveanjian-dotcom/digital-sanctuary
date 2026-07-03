import { defineConfig } from 'vite';

export default defineConfig({
  // 用相对路径引用资源,这样无论部署到根域名还是子目录都能正常工作
  base: './',
});
