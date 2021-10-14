const path = require('path');

module.exports = {
  entry: './src/peerfetch.ts',
  devtool: 'inline-source-map',  
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
    filename: 'peerfetch.js',
    path: path.resolve(__dirname, 'dist'),
    library: "peerfetch",
  },
  optimization: {
    usedExports: false,
  },  
};