// const platform = require('@serverless/platform-sdk')
//
// /*
// * Transform
// * - Transform Service Component state to Platform state
// */
//
// const transform = (state) => {
//   // Defaults
//   const platform_service = {
//     app: null,
//     tenant: null,
//     accessKey: null,
//     version: '0.1.0',
//     service: {
//       name: null,
//       description: null,
//       repository: null
//     },
//     functions: [],
//     subscriptions: []
//   }
//
//   const platform_function = {
//     functionId: null,
//     details: {
//       runtime: null,
//       memory: null,
//       timeout: null
//     },
//     package: {
//       handler: null,
//       name: null,
//       arn: null
//     }
//   }
//
//   const platform_subscription_eventgateway = {
//     functionId: null,
//     details: {
//       type: null, // Event Type
//       function: null,
//       source: null,
//       path: '/',
//       method: 'POST',
//       app: null,
//       service: null,
//       stage: null
//     },
//     provider: {
//       name: 'Serverless',
//       tenant: null
//     },
//     properties: {
//       name: null,
//       service: null,
//       stage: null
//     }
//   }
// }
//
// /*
// * Publish
// * - Publish to the serverless platform
// */
//
// const publish = (state) => {
//   // platform.publishService(data)
//   //   .then((serviceUrl) => {
//   //     this.serverless.cli
//   //       .log('Successfully published your service on the Serverless Platform');
//   //     this.serverless.cli.log(`Service URL:  ${serviceUrl}`);
//   //   })
//   //   .catch(() => {
//   //     this.serverless.cli.log('Failed to publish your service on the Serverless Platform');
//   //   })
// }
//
// /*
// * Archive
// * - Archive the service on the serverless platform
// */
//
// const archive = (service) => {}
