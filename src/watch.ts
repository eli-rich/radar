import { stat, watch } from 'node:fs/promises';
import { join } from 'node:path';
import config from './config.js';
import { LOG_LEVEL, log } from './logger.js';
import upload from './upload.js';

const WATCH_DIR = config.WATCH_DIR;

const ac = new AbortController();
const { signal } = ac;

const actives = new Set<string>();

const waitForSave = async (filename: string) => {
	try {
		let { size: oldSize } = await stat(filename);
		// wait for file to not change for 1 second
		// if file size has changed, wait one more second
		// if file size has not changed, return
		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const { size: newSize } = await stat(filename);
			if (oldSize === newSize) return;
			oldSize = newSize;
		}
	} catch (err) {
		if (err instanceof Error) log(LOG_LEVEL.ERROR, err);
	}
};

export const watchDir = async () => {
	try {
		const watcher = watch(WATCH_DIR, { signal });
		for await (const event of watcher) {
			log(LOG_LEVEL.INFO, `${event.eventType} ${event.filename}`);
			if (event.filename === null) {
				console.error(event);
				const err = new Error(`Event Type: ${event.eventType}. Filename: is null`);
				log(LOG_LEVEL.FATAL, err);
				continue;
			}
			if (actives.has(event.filename)) {
				actives.delete(event.filename);
				log(LOG_LEVEL.INFO, `Skipping ${event.filename}`);
				continue;
			}
			actives.add(event.filename);
			await waitForSave(join(WATCH_DIR, event.filename));
			await upload(event.filename);
		}
	} catch (err) {
		const e = err instanceof Error ? err : `WatchDir catch block triggered.\nError: ${err}`;
		log(LOG_LEVEL.WARN, e);
	}
};
