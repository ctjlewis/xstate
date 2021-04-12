import typescript from 'rollup-plugin-typescript2';
import rollupReplace from 'rollup-plugin-replace';
import fileSize from 'rollup-plugin-filesize';
import ClosureCompiler from '@ampproject/rollup-plugin-closure-compiler';
import { terser } from 'rollup-plugin-terser';

const closureCompilerDefaults = {
  /**
   * Configure the compiler to use max compression.
   */
  compilation_level: 'ADVANCED',
  /**
   * Support latest features and output ES2015.
   */
  language_in: 'ES_NEXT',
  language_out: 'ECMASCRIPT_2015',
  /**
   * Try to guarantee a compile, i.e., exit 0.
   */
  jscomp_warning: ['*']
};

const createClosureCompiler = ({ ...closureCompilerOverrides } = {}) => {
  // return terser({ toplevel: true });
  return ClosureCompiler({
    ...closureCompilerDefaults,
    ...closureCompilerOverrides
  });
};

const createTsPlugin = ({ declaration = true, ...tsOverrides } = {}) =>
  typescript({
    clean: true,
    tsconfigOverride: {
      compilerOptions: {
        declaration,
        ...tsOverrides
      }
    }
  });

const createNpmConfig = ({ input, output, ...tsOverrides }) => ({
  input,
  output,
  preserveModules: true,
  plugins: [
    createTsPlugin({
      ...tsOverrides
    }),
    createClosureCompiler()
  ]
});

const createUmdConfig = ({ input, output, ...tsOverrides }) => ({
  input,
  output,
  plugins: [
    createTsPlugin({
      declaration: false,
      ...tsOverrides
    }),
    rollupReplace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    createClosureCompiler(),
    fileSize({
      showBeforeSizes: 'release',
      showBrotliSize: true
    })
  ]
});

export default [
  createNpmConfig({
    input: 'src/index.ts',
    output: [
      {
        dir: 'es',
        format: 'esm'
      }
    ]
  }),
  createUmdConfig({
    input: 'src/index.ts',
    output: {
      file: 'dist/xstate.js',
      format: 'umd',
      name: 'XState'
    }
  }),
  createUmdConfig({
    input: 'src/interpreter.ts',
    output: {
      file: 'dist/xstate.interpreter.js',
      format: 'umd',
      name: 'XStateInterpreter'
    }
  }),
  createUmdConfig({
    input: 'src/index.ts',
    output: {
      file: 'dist/xstate.web.js',
      format: 'esm'
    },
    target: 'ES2015'
  })
];
