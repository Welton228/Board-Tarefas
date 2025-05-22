// vercel-build.js
const { execSync } = require('child_process');

console.log('🚀 Iniciando build customizado...');
execSync('npm install', { stdio: 'inherit' });
execSync('npx prisma generate', { stdio: 'inherit' });
execSync('npm run build', { stdio: 'inherit' });