const path = require("path");

module.exports = {
    mode: 'production',
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
    entry: {
        'libpgs': {
            import: './src/libpgs.ts',
            library: { name: 'libpgs', type: 'umd' },
        },
        'libpgs.worker': {
            import: './src/worker.ts'
        }
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    }
}
