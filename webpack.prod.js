const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const outputName = '[name]';

module.exports = merge(common(outputName), {
	mode: 'production',
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: true,	// conosole.log削除
					},
				},
			})
		],
	},
});
