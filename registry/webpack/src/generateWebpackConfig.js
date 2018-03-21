import autoprefixer from 'autoprefixer'
import { assoc, keys, prop, reduce } from 'ramda'
import path from 'path'
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes'
import postcssNested from 'postcss-nested'
import webpack from 'webpack'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'


const generateWebpackConfig = ({
  entry,
  env,
  favicon,
  template
}, { getTempDir }) => {

  console.log('process.cwd:', process.cwd())
  // Webpack uses `publicPath` to determine where the app is being served from.
  // In development, we always serve from the root. This makes config easier.
  const publicPath = '/'

  const babelLoaderConfiguration = {
    test: /\.(js|jsx|mjs)$/,
    // TODO BRN: This may need to be exposed as a property
    include: [],
    use: {
      loader: require.resolve('babel-loader'),
      options: {
        //TODO BRN: Figure out necessary presets for
        // This is a feature of `babel-loader` for webpack (not Babel itself).
        // It enables caching results in ./node_modules/.cache/babel-loader/
        // directory for faster rebuilds.
        cacheDirectory: true
      }
    }
  }

  // "postcss" loader applies autoprefixer to our CSS.
  // "css" loader resolves paths in CSS and adds assets as dependencies.
  // "style" loader turns CSS into JS modules that inject <style> tags.
  // In production, we use a plugin to extract that CSS to a file, but
  // in development "style" loader enables hot editing of CSS.

  const cssLoaderConfiguration = {
    test: /\.css$/,
    use: [
      require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          modules: true,
          localIdentName: '[name]__[local]___[hash:base64:5]'
        }
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebookincubator/create-react-app/issues/2677
          ident: 'postcss',
          plugins: () => [
            postcssFlexbugsFixes,
            autoprefixer({
              browsers: [
                '>1%',
                'last 4 versions',
                'Firefox ESR',
                'not ie < 9' // React doesn't support IE8 anyway
              ],
              flexbox: 'no-2009'
            }),
            postcssNested
          ]
        }
      }
    ]
  }
  const imageLoaderConfiguration = {
    test: /\.(gif|jpe?g|png|svg)$/,
    use: {
      loader: 'url-loader',
      options: {
        name: '[name].[ext]'
      }
    }
  }

  const defineConfiguration = reduce((def, key) => {
    const value = prop(key, env)
    return assoc(`process.env.${key}`, JSON.stringify(value), def)
  }, {}, keys(env))

  return {
    entry,
    module: {
      rules: [
        babelLoaderConfiguration,
        cssLoaderConfiguration,
        imageLoaderConfiguration
      ]
    },

    plugins: [
      // `process.env.NODE_ENV === 'production'` must be `true` for production
      // builds to eliminate development checks and reduce build size. You may
      // wish to include additional optimizations.
      new webpack.DefinePlugin(defineConfiguration),
      new HtmlWebpackPlugin({
        hash: true,
        favicon,
        filename: 'index.html',
        template
      }),
      new CopyWebpackPlugin([
        { from: 'static' }
      ])
    ],

    resolve: {
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebookincubator/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: [ '.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx' ],
      alias: {

        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web'
      }
    },

    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    },

    output: {
      filename: '[name].bundle.js',
      path: getTempDir(),
      publicPath
    }
  }
}

export default generateWebpackConfig
