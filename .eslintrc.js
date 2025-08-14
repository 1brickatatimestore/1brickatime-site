cat > .eslintrc.js <<'JS'
/* So lint doesn't block you while shipping */
module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@next/next/no-img-element': 'off',
    'no-console': 'warn'
  }
};
JS