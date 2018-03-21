import 'babel-polyfill'
import Webpack from 'webpack'
import generateWebpackConfig from './generateWebpackConfig'

const deploy = async (inputs, context) => {
  const webpackConfig = generateWebpackConfig(inputs, context)
  const compiler = Webpack(webpackConfig)

  return new Promise((resolve, reject) => {
    context.log('Packing code with webpack')
    compiler.run((error, stats) => {
      if (error) {
        return reject(error)
      } else if (stats.compilation.errors) {
        return reject(stats.compilation.errors[0])
      }

      // TODO BRN: Check for errors in stats
      const outputs = {
        hash: stats.hash,
        output: webpackConfig.output
      }
      return resolve(outputs)
    })
  })
}

const remove = async () => ({})

export {
  deploy,
  remove
}
