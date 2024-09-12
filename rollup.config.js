import typescript from "@rollup/plugin-typescript";
import terser from '@rollup/plugin-terser';
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";

const typescriptOptions = {
    compilerOptions: {
        lib: ["es2015", "dom"],
        target: "es5"
    }
};

const terserOptions = {
    module: true
};

export default [
    {
        input: 'src/libpgs.ts',
        output: {
            file: 'dist/libpgs.js',
            format: 'es'
        },
        plugins: [
            terser(terserOptions),
            typescript(typescriptOptions),
            commonjs(),
            nodeResolve()
        ]
    },
    {
        input: 'src/worker.ts',
        output: {
            file: 'dist/libpgs.worker.js',
            format: 'es'
        },
        plugins: [
            terser(terserOptions),
            typescript(typescriptOptions),
            commonjs(),
            nodeResolve()
        ]
    }
];
