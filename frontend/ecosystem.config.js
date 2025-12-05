module.exports = {
  apps: [
    {
      name: 'battle-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/py/battle/frontend',
      env: {
        NODE_ENV: 'production',
        BACKEND_URL: 'http://localhost:8000',
        NEXT_PUBLIC_DEFAULT_JUDGE_ID: '1',
      },
    },
  ],
};
