const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectName = process.argv[2]; // Get project name from command-line argument

if (!projectName) {
  console.error("❌ Please provide a project name: node scaffold.js myProject");
  process.exit(1);
}

const projectPath = path.join(process.cwd(), projectName);
const srcPath = path.join(projectPath, 'src');
const distPath = path.join(projectPath, 'dist');

// Create the project, src, and dist folders
fs.mkdirSync(projectPath, { recursive: true });
fs.mkdirSync(srcPath, { recursive: true });
fs.mkdirSync(distPath, { recursive: true });

// Define file contents
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
</head>
<body>

</body>
</html>`;

const cssContent = `body {
    font-family: Arial, sans-serif;
}`;

const jsContent = `
import './style.css'
console.log("Hello from ${projectName}!");
`;

// Write files to src directory
fs.writeFileSync(path.join(srcPath, "template.html"), htmlContent);
fs.writeFileSync(path.join(srcPath, "style.css"), cssContent);
fs.writeFileSync(path.join(srcPath, "index.js"), jsContent);

// Initialize Git repository
execSync("git init", { cwd: projectPath, stdio: 'inherit' });
execSync("npm init -y", { cwd: projectPath, stdio: 'inherit' });

// Add scripts to package.json
const pkgPath = path.join(projectPath, 'package.json');
const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

pkgJson.scripts = {
  ...pkgJson.scripts,
  test: "node --experimental-vm-modules ./node_modules/.bin/jest",
  start: "webpack serve --config webpack.dev.js --mode development",
  build: "webpack --config webpack.prod.js --mode production",
  deploy: "git subtree push --prefix dist origin gh-pages",
  lint: "eslint 'src/**/*.{js,jsx}'",
  lintfix: "eslint 'src/**/*.{js,jsx}' --fix",
  format: "prettier --write 'src/**/*.{js,jsx,css,html}'",
};

pkgJson.type = "module";

fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2));

execSync("npm install --save-dev webpack webpack-cli style-loader css-loader html-loader html-webpack-plugin webpack-dev-server jest babel-loader eslint", { cwd: projectPath, stdio: 'inherit' });

// Create webpack configuration files
const webpackCommonContent = `import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import path from 'path';

export default {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /.html$/i,
        loader: "html-loader",
      },
      {
        test: /.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      }
    ],
  },
};`;

const webpackDevContent = `import { merge } from 'webpack-merge';
import common from './webpack.common.js';
import HtmlWebpackPlugin from "html-webpack-plugin";

const config = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    hot: true,
    watchFiles: ['./src/**/*'],
    liveReload: true, 
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/template.html",
      filename: "index.html",
    }),
  ],
});

export default config;`;

const webpackProdContent = `import { merge } from 'webpack-merge';
import common from './webpack.common.js';
import TerserPlugin from 'terser-webpack-plugin';
import HtmlWebpackPlugin from "html-webpack-plugin";

export default merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new HtmlWebpackPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
  ],
});`;

const jestConfig = `
export default {
    testEnvironment: 'node',
    transform: {}, // required to silence transform warnings when using ESM without Babel
  };
`

fs.writeFileSync(path.join(projectPath, "webpack.common.js"), webpackCommonContent);
fs.writeFileSync(path.join(projectPath, "webpack.dev.js"), webpackDevContent);
fs.writeFileSync(path.join(projectPath, "webpack.prod.js"), webpackProdContent);
fs.writeFileSync(path.join(projectPath, "jest.config.js"), jestConfig);

// Create .gitignore file
const gitignoreContent = `node_modules/
dist/
`;

fs.writeFileSync(path.join(projectPath, ".gitignore"), gitignoreContent);

console.log(`✅ Project "${projectName}" scaffolded successfully!`);
console.log(`📁 Navigate to the project: cd ${projectName}`);
console.log(`🚀 Start coding!`);