import puppeteer from 'puppeteer';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';

const options = '{{OPTIONS}}';

function getComponent() {
	'{{CODE}}';
}

const sheet = new ServerStyleSheet();
const MARKUP = renderToStaticMarkup(
	sheet.collectStyles(
		<div
			style={{
				background: 'rgb(244,244,244)',
				padding: '25px',
				width: '100vw',
				height: '100vh',
				boxSizing: 'border-box',
			}}
		>
			{getComponent()}
		</div>,
	),
);
const STYLE_TAGS = sheet.getStyleTags();
const HTML = `${STYLE_TAGS}
${MARKUP}`;

console.log(HTML);

async function doSnapshot() {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.setViewport({
			width: options.width || 960,
			height: options.height || 760,
			deviceScaleFactor: options.deviceScaleFactor || 1,
		});

		await page.setContent(
			`<style>html,body{margin: 0; padding:0;}</style>${HTML}`,
		);
		await page.screenshot({
			path: `./.snapshots/${options.name}.${options.describe}.png`,
		});
		await browser.close();
	} catch (error) {
		console.error(error);
	}
	IS_EVAL_DONE = true;
}

doSnapshot();
