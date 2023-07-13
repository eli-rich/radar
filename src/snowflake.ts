import dayjs from 'dayjs';
import { LOG_LEVEL, log } from './logger.js';

export const EPOCH = dayjs('2002-07-18 17:17 -5:00', 'YYYY-MM-DD HH:mm Z');

export class Snowflake {
	timestamp: number;
	machineId: number;
	sequence: number;
	lastNow: number;
	constructor(public id?: number) {
		this.timestamp = EPOCH.valueOf();
		this.machineId = id ?? 0;
		this.sequence = 0;
		this.lastNow = 0;
	}
	get slug(): string {
		const now = dayjs();
		if (now.valueOf() !== this.lastNow) this.sequence = 0;
		this.lastNow = now.valueOf();
		const diff = now.diff(EPOCH, 'millisecond');
		if (diff < 0) {
			const err = new Error('Time is moving backwards!');
			log(LOG_LEVEL.FATAL, err);
		}
		// signed bit
		let result = '';

		const timestamp = diff.toString(2);
		const machineId = this.machineId.toString(2);
		const sequence = this.sequence.toString(2);

		result += timestamp.padStart(41, '0');
		result += machineId.padStart(10, '0');
		result += sequence.padStart(12, '0');
		// 41 + 10 + 12 = 63
		// 41 bits for timestamp
		// 10 bits for machine id
		// 12 bits for sequence
		// 1 bit for signed bit

		this.sequence++;

		const flakeId = BigInt(`0b${result}`);
		const buf = Buffer.alloc(8);
		try {
			buf.writeBigInt64BE(flakeId, 0);
		} catch (err) {
			log(
				LOG_LEVEL.INFO,
				`result: ${result}\nflakeId: ${flakeId}\nsequence: ${this.sequence - 1}\nbuf: ${buf}`,
			);
			const e = err instanceof Error ? err : 'Non-error object in snowflake catch block';
			log(LOG_LEVEL.FATAL, e);
		}
		return buf.toString('base64url').slice(0, -1);
	}
}
