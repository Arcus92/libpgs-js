const path = require("path");

module.exports = {
    mode: 'production',
    entry: './src/libpgs.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'libpgs.js',
        library: 'libpgs',
        libraryTarget: 'umd'
    }
}
