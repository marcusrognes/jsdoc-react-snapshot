#!/usr/bin/env node

require.main.paths.unshift(require('./lib/fsFindUp')('node_modules'));

/**
 * TODO: Fix issue with running in project sub folder, for some reason babel wont transform.
 */
//console.log(require('./lib/fsFindUp')('node_modules'));
//console.log(require('./lib/fsFindUp')('.babelrc'));

const babel = require('@babel/core');
const chalk = require('chalk');
const jsdoc = require('jsdoc-api');
const fs = require('fs');
const glob = require('glob');
const snapshotRunner = fs
	.readFileSync(__dirname + '/lib/snapshotRunner.js')
	.toString();
const program = require('commander');

const babelConfigFile = require('./lib/fsFindUp')('.babelrc');

program.version('0.0.1');

program.option('-f, --files <glob>', 'Files to match');

program.parse(process.argv);

if (!program.files) {
	throw new Error('Files missing');
}

function customPrintTest(test) {
	test.split(/\r\n|\r|\n/g).forEach(line =>
		console.log('    ' + chalk.green(line.trim())),
	);
	console.log('');
}

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

glob(
	program.files,
	{ ignore: '**/node_modules/**/*' },
	async (error, files) => {
		if (error) {
			throw error;
		}

		// Get the file data and documentation data from the matched files.
		const fileData = files.map(filePath => {
			const fileData = fs.readFileSync(filePath).toString();
			return {
				file: filePath,
				jsdoc: jsdoc.explainSync({ source: fileData }),
				fileData,
			};
		});

		const snapshots = [];

		// Get all tests within the documentation
		fileData.forEach(file => {
			file.jsdoc.forEach(comment => {
				comment.tags &&
					comment.tags.forEach(tag => {
						if (tag.title != 'snapshot') {
							return;
						}

						let testCode = tag.value.trim();
						let describe = '';
						let options = {};

						if (testCode.charAt(0) === '"') {
							const match = testCode.match(/\"(.*?)\"/);
							testCode = testCode.replace(match[0], '').trim();
							describe = match[1];
						}

						if (testCode.charAt(0) === '{') {
							const match = testCode.match(/\{(.*?)\}/);
							testCode = testCode.replace(match[0], '').trim();
							options = JSON.parse(match[0]);
						}

						snapshots.push({
							name: comment.name,
							type: comment.kind,
							describe,
							options,
							file: file.file,
							testCode,
							fileData: file.fileData,
						});
					});
			});
		});

		console.log(`Found ${snapshots.length} snapshots to snap`);
		let success = 0;
		let failed = 0;
		let printedHeaders = [];

		// Run all tests and wait for results
		await Promise.all(
			snapshots.map(async snapshot => {
				const header = `${snapshot.type}: ${snapshot.name} in ${snapshot.file}`;
				if (printedHeaders.indexOf(header) === -1) {
					console.log(chalk.green(header));
					printedHeaders.push(header);
				}

				console.log(`${snapshot.describe || 'Running'}:`);

				customPrintTest(`${snapshot.testCode}`);

				try {
					let code = `
${snapshot.fileData}

${snapshotRunner.replace("'{{CODE}}';", snapshot.testCode).replace(
	"'{{OPTIONS}}'",
	JSON.stringify({
		name: snapshot.name,
		describe: snapshot.describe,
		...snapshot.options,
	}),
)}
`;
					let transpiledCode = '';

					try {
						transpiledCode = await new Promise(
							(resolve, reject) => {
								babel.transform(
									code,
									{
										babelrc: !!babelConfigFile,
										filename: babelConfigFile,
										plugins: [
											'@babel/plugin-transform-runtime',
										],
									},
									(error, result) => {
										if (error) {
											return reject(error);
										}

										return resolve(result.code);
									},
								);
							},
						);
					} catch (error) {
						throw new Error(
							`Failed to transform snapshot code: ${error.message}`,
						);
					}

					var IS_EVAL_DONE = false;

					eval(transpiledCode);

					while (!IS_EVAL_DONE) {
						await sleep(1000);
					}

					success++;
				} catch (error) {
					failed++;
					console.log(
						chalk.red(
							require('util').inspect(error, {
								colors: true,
								depth: null,
							}),
						),
					);
				}
			}),
		);

		if (success)
			console.log(
				chalk.green(`Snapshots finished successfully: ${success}`),
			);
		if (failed) console.log(chalk.red(`Snapshots failed: ${failed}`));

		process.exit();
	},
);
