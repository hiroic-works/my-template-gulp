const path = require('path');

const assetPath = './src/assets/js';
const distPath = 'public';
const entries = {
	app: `${assetPath}/app.js`
}
module.exports = (outputName) => ({
	entry: entries,

	output: {
		path: path.resolve(__dirname, distPath),
		filename: `${outputName}.js`,
		chunkFilename: `${outputName}.js`,
	},
	plugins: [

	],
	resolve: {
		alias: {
			'@js': path.resolve(__dirname, assetPath)
		},
		extensions: ['.js'],
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	},
	module: {
		rules: [
			{
				// 拡張子 .js の場合
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			}
		]
	},
});
