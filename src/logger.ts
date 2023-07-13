import dayjs from 'dayjs';
import { createWriteStream } from 'node:fs';

const writer = createWriteStream('log.txt', { flags: 'a' });

export const LOG_LEVEL = {
	DEBUG: 'DEBUG',
	INFO: 'INFO',
	WARN: 'WARN',
	ERROR: 'ERROR',
	FATAL: 'FATAL',
} as const;

type ObjectValues<T> = T[keyof T];

export type LogLevel = ObjectValues<typeof LOG_LEVEL>;

export const log = (level: LogLevel, message: string | Error) => {
	const now = dayjs().format('YYYY-MM-DD HH:mm:ss[Z]');
	if (typeof message === 'string') {
		writer.write(`[${level}]: ${message} at ${now}\n`);
	} else {
		writer.write(
			`\n[${level}]: ${message.name} at ${now}\n${message.message}\n}\n${
				message.stack ?? 'No Stack Trace'
			}\n`,
		);
	}
	if (level === LOG_LEVEL.FATAL) {
		close();
		process.exit(1);
	}
};

export const close = () => {
	writer.write('\n');
	writer.close();
};
