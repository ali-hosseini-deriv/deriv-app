const CircularDependencyPlugin = require('circular-dependency-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
// const HtmlWebPackPlugin = require('html-webpack-plugin');
// const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const IgnorePlugin = require('webpack').IgnorePlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const StylelintPlugin = require('stylelint-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const AssetsManifestPlugin = require('webpack-manifest-plugin');

const {
    copyConfig,
    cssConfig,
    // htmlInjectConfig,
    // htmlOutputConfig,
    stylelintConfig,
} = require('./config');
const {
    css_loaders,
    file_loaders,
    html_loaders,
    js_loaders,
    svg_file_loaders,
    svg_loaders,
} = require('./loaders-config');

const IS_RELEASE = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

const ALIASES = {
    Components: path.resolve(__dirname, '../src/Components'),
    Containers: path.resolve(__dirname, '../src/Containers'),
    Constants: path.resolve(__dirname, '../src/Constants'),
    Duplicated: path.resolve(__dirname, '../src/Duplicated'),
    Helpers: path.resolve(__dirname, '../src/Helpers'),
    Layout: path.resolve(__dirname, '../src/Layout'),
    Modules: path.resolve(__dirname, '../src/Modules'),
    Sections: path.resolve(__dirname, '../src/Sections'),
    Services: path.resolve(__dirname, '../src/Services'),
    Stores: path.resolve(__dirname, '../src/Stores'),
    Styles: path.resolve(__dirname, '../src/Styles'),
    /* TODO: REMOVE these once shared refactor is done. */
};

const rules = (is_test_env = false, is_mocha_only = false) => [
    ...(is_test_env && !is_mocha_only
        ? [
              {
                  test: /\.(js|jsx)$/,
                  exclude: /node_modules|__tests__|(build\/.*\.js$)|(_common\/lib)/,
                  include: /src/,
                  loader: 'eslint-loader',
                  enforce: 'pre',
                  options: {
                      formatter: require('eslint-formatter-pretty'),
                      configFile: path.resolve(__dirname, '../.eslintrc.js'),
                      ignorePath: path.resolve(__dirname, '../.eslintignore'),
                  },
              },
          ]
        : []),
    {
        test: /\.(js|jsx)$/,
        exclude: is_test_env ? /node_modules/ : /node_modules|__tests__/,
        include: is_test_env ? /__tests__|src/ : /src/,
        use: js_loaders,
    },
    {
        test: /\.html$/,
        exclude: /node_modules/,
        use: html_loaders,
    },
    {
        test: /\.(png|jpg|gif|woff|woff2|eot|ttf|otf)$/,
        exclude: /node_modules/,
        use: file_loaders,
    },
    {
        test: /\.svg$/,
        exclude: /node_modules/,
        include: /public\//,
        use: svg_file_loaders,
    },
    {
        test: /\.svg$/,
        exclude: /node_modules|public\//,
        use: svg_loaders,
    },
    is_test_env
        ? {
              test: /\.(sc|sa|c)ss$/,
              loaders: 'null-loader',
          }
        : {
              test: /\.(sc|sa|c)ss$/,
              use: css_loaders,
          },
];

const MINIMIZERS = !IS_RELEASE
    ? []
    : [
          new TerserPlugin({
              test: /\.js/,
              exclude: /(smartcharts)/,
              parallel: true,
              sourceMap: true,
          }),
          new OptimizeCssAssetsPlugin(),
      ];

const plugins = (base, is_test_env, is_mocha_only) => [
    new CleanWebpackPlugin(),
    new CopyPlugin(copyConfig(base)),
    // new HtmlWebPackPlugin(htmlOutputConfig()),
    // new HtmlWebpackTagsPlugin(htmlInjectConfig()),
    new IgnorePlugin(/^\.\/locale$/, /moment$/),
    new MiniCssExtractPlugin(cssConfig()),
    new CircularDependencyPlugin({ exclude: /node_modules/, failOnError: true }),
    ...(IS_RELEASE
        ? []
        : [new AssetsManifestPlugin({ fileName: 'asset-manifest.json', filter: (file) => file.name !== 'CNAME' })]),
    ...(is_test_env && !is_mocha_only
        ? [new StylelintPlugin(stylelintConfig())]
        : [
              // ...(!IS_RELEASE ? [ new BundleAnalyzerPlugin({ analyzerMode: 'static' }) ] : []),
          ]),
];

module.exports = {
    IS_RELEASE,
    ALIASES,
    plugins,
    rules,
    MINIMIZERS,
};
