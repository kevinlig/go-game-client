import webpack from 'webpack';
import path from 'path';

export default {
	entry: './src/js/main.js',
	output: {
		path: path.join(__dirname, 'public', 'js'),
		publicPath: 'js/',
		filename: 'app.js',
		chunkFilename: 'chunk.[chunkhash].js'
	},
	devtool: 'eval',
	debug: true,
	cache: true,
	module: {
		loaders: [{
			test: /\.jsx?$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			query: {
				cacheDirectory: './cache/'
			}
		},
		{
			test: /\.json$/,
			loader: 'json-loader'
		}]
	}
}