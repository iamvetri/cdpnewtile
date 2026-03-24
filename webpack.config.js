 const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const LAUNCH_COMMAND = process.env.npm_lifecycle_event;
console.log("LAUNCH_COMMAND: " + LAUNCH_COMMAND);
const isProd = LAUNCH_COMMAND === 'prod';

console.log("Production Build: " + isProd);

const baseConfig = {
    context: __dirname,
    entry: './src/index.tsx',
    plugins: [
        new HtmlWebpackPlugin({ title: 'Caching' }),
    ],
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'main.[contenthash].js',
        // CDP portal serves the tile from a nested URL; use relative asset URLs in prod
        publicPath: isProd ? '' : '/',
    },
    devServer: {
        historyApiFallback: true,
        open: true,
        port: 3005
    },
    module: {
        rules: [{
            test: /\.(ts|js)x?$/i,
            exclude: /node_modules/,
            use: 'babel-loader'

        },
        {
            test: /\.less$/i,
            use: [
                // compiles Less to CSS
                "style-loader",
                "css-loader",
                "less-loader",
            ],
        },
        {
            test: /\.(png|j?g|svg|gif)?$/,
            use: 'file-loader?name=./[name].[ext]'
        }
        ]
    },
    externals: {
        'onsenui': 'ons'
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    }

};


const devConfig = {
    devtool: 'eval',
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html'),
            filename: 'index.html'
        }), new ForkTsCheckerWebpackPlugin({
            typescript: {
                diagnosticOptions: {
                    semantic: true,
                    syntactic: true,
                },
            },
        })
    ]
};

const prodConfig = {
    devtool: 'source-map',
    plugins: [new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        filename: 'index.html',
        minify: {
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
            removeComments: true,
            useShortDoctype: true,
            keepClosingSlash: true,
            collapseWhitespace: false,
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeStyleLinkTypeAttributes: true,
            noErrorOnMissing: true
        }
    }),
    new CopyPlugin({
        patterns: [
            {
                from: "*.png",
                context: path.resolve(__dirname, "public"),
                to: "[name][ext]",
                noErrorOnMissing: true
            },
            {
                from: "custom_console.js",
                context: path.resolve(__dirname, "public"),
                to: "[name][ext]",
                noErrorOnMissing: true
            },
            {
                from: "tile*",
                context: path.resolve(__dirname, "public"),
                to: "[name][ext]",
                noErrorOnMissing: true
            },
            {
                from: "*.less",
                context: path.resolve(__dirname, "public"),
                to: "[name][ext]",
                noErrorOnMissing: true
            }
        ]
    })
    ]
};

const mainConfig = isProd ? {
    ...baseConfig,
    ...prodConfig
} : {
    ...baseConfig,
    ...devConfig
};

module.exports = mainConfig;