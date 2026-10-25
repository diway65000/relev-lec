// Permet de définir le chemin de base (GitHub Pages = /nom-du-depot) au moment du build
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
