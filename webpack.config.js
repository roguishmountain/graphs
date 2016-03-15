var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry:
    {
        bundle: [
            'babel-polyfill', // necessary for hot reloading with IE
            './src/main.tsx'
        ]
    },

    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    },

    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.ProvidePlugin({
            'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        })
    ],

    debug: true,
    devtool: 'source-map',

    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },

    module: {
        loaders: [{
            test: /\.ts(x?)$/,
            exclude: /node_modules/,
            loader: 'babel-loader?presets[]=es2015&presets[]=react!ts-loader'
        }, {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel?cacheDirectory',
                query: {
                    presets: ['es2015', 'react']
                }
            }]
    }
    //   },
    //     module: {
    //         loaders: [
    //             // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
    //             { test: /\.tsx?$/, loader: 'babel?loose=all!ts', include: path.join(__dirname, 'src') }
    //         ]
    //     }
}