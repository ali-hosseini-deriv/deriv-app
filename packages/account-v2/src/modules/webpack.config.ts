import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
const entries = require('./webpack-entries.json');

const isRelease =
    process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'test';

export default () => ({
    devtool: isRelease ? 'source-map' : 'eval-cheap-module-source-map',
    entry: entries,
    externals: [
        {
            '@deriv/quill-icons': '@deriv/quill-icons',
            '@deriv/api': '@deriv/api',
            react: true,
            'react-dom': true,
            'react-router-dom': true,
        },
    ],
    mode: 'development',
    module: {
        rules: [
            {
                // https://github.com/webpack/webpack/issues/11467
                include: /node_modules/,
                resolve: {
                    fullySpecified: false,
                },
                test: /\.m?js/,
            },
            {
                exclude: /node_modules/,
                test: /\.(js|jsx|ts|tsx)$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            rootMode: 'upward',
                        },
                    },
                ],
            },
            {
                loader: 'source-map-loader',
                test: (input: string) => isRelease && input.endsWith('.js'),
            },
            {
                test: /\.(sc|sa|c)ss$/,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                auto: (path: string) => path.includes('.module.'),
                                localIdentName: isRelease ? '[hash:base64]' : '[path][name]__[local]',
                            },
                            url: true,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                    },
                    {
                        loader: 'resolve-url-loader',
                        options: {
                            keepQuery: true,
                            sourceMap: true,
                        },
                    },
                    'sass-loader',
                    {
                        loader: 'sass-resources-loader',
                        options: {
                            // Provide path to the file with resources
                            resources: [
                                './src/index.css',
                                // eslint-disable-next-line global-require, import/no-dynamic-require
                                ...require('../../../shared/src/styles/index.js'),
                            ],
                        },
                    },
                ],
            },
            {
                exclude: /node_modules/,
                generator: {
                    filename: 'account-v2/assets/[name].[contenthash][ext]',
                },
                include: /assets\//,
                issuer: /\/packages\/account-v2\/[^/]+(?:\/[^/]+)*\.scss/,
                test: /\.svg$/,
                type: 'asset/resource',
            },
            {
                exclude: /node_modules/,
                include: /assets\//,
                issuer: /\/packages\/account-v2\/[^/]+(?:\/[^/]+)*\.tsx/,
                test: /\.svg$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            rootMode: 'upward',
                        },
                    },
                    {
                        loader: 'react-svg-loader',
                        options: {
                            jsx: true,
                            svgo: {
                                floatPrecision: 3,
                                plugins: [
                                    { removeTitle: false },
                                    { removeUselessStrokeAndFill: false },
                                    { removeUnknownsAndDefaults: false },
                                    { removeViewBox: false },
                                ],
                            },
                        },
                    },
                ],
            },
        ],
    },
    output: {
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: '@deriv-lib/account-v2-lib',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
            chunkFilename: '[id].css',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src', 'index.d.ts'),
                    to: path.resolve(__dirname, './dist/types', 'index.d.ts'),
                },
            ],
        }),
    ],
});
