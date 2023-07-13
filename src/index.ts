import { close, log, LOG_LEVEL } from './logger.js';
import { watchDir } from './watch.js';

log(LOG_LEVEL.INFO, 'Starting session');

process.on('uncaughtException', (err) => {
	log(LOG_LEVEL.ERROR, err);
	close();
	process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
	const e = err instanceof Error ? err : `Promise: ${promise}\nError: ${err}`;
	log(LOG_LEVEL.ERROR, e);
	close();
	process.exit(1);
});

process.on('SIGINT', () => {
	log(LOG_LEVEL.INFO, 'Received SIGINT');
	close();
	process.exit(0);
});

process.on('SIGTERM', () => {
	log(LOG_LEVEL.WARN, 'Received SIGTERM');
	close();
	process.exit(0);
});

process.on('exit', () => {
	close();
	log(LOG_LEVEL.INFO, 'Shutting down session');
});

await watchDir();
