module.exports = {
  style: {
    postcss: {
      mode: "extends",
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  devServer: (devServerConfig) => {
    // Intercept and map the deprecated hooks safely to avoid crashing Webpack 5
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      if (devServerConfig.onBeforeSetupMiddleware) {
        devServerConfig.onBeforeSetupMiddleware(devServer.app, devServer);
      }
      if (devServerConfig.onAfterSetupMiddleware) {
        devServerConfig.onAfterSetupMiddleware(devServer.app, devServer);
      }
      return middlewares;
    };
    
    // Explicitly clean out the problematic keys so Webpack can bind to the port cleanly
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    return devServerConfig;
  },
};