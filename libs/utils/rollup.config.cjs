const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: '../../dist/libs/utils',
    tsConfig: './tsconfig.lib.json',
    compiler: 'swc',
    format: ['cjs', 'esm'],
    assets: [{ input: '{projectRoot}', output: '.', glob: '*.md' }],
  },
  {
    output: {
      sourcemap: true,
      sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
        // Fix source map paths
        return relativeSourcePath;
      },
    },
    onwarn(warning, warn) {
      // Ignore source map warnings
      if (warning.code === 'SOURCEMAP_ERROR' || warning.message?.includes('source map')) {
        return;
      }
      warn(warning);
    },
  },
);
