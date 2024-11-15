module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation for atproto-handle'
  },
  servers: [
    {
      url: 'http://localhost:3000/',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'api-key', // Name of the header parameter
      },
    },
  },
}