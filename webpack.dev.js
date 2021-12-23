const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const outputName = '[name]';

module.exports = merge(common(outputName), {
	mode: 'development',
	devtool: 'source-map'
});
