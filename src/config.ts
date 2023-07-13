import dotenv from 'dotenv';
import { z } from 'zod';
import { LOG_LEVEL, log } from './logger.js';
dotenv.config();

const configSchema = z.object({
	ACCOUNT_ID: z.string(),
	ACCESS_KEY: z.string(),
	SECRET_KEY: z.string(),
	WATCH_DIR: z.string(),
	BASE_URL: z.string().url(),
	BUCKET: z.string(),
});

const envConfig = {
	ACCOUNT_ID: process.env.ACCOUNT_ID,
	ACCESS_KEY: process.env.ACCESS_KEY_ID,
	SECRET_KEY: process.env.SECRET_ACCESS_KEY,
	WATCH_DIR: process.env.WATCH_DIR,
	BASE_URL: process.env.BASE_URL,
	BUCKET: process.env.BUCKET,
};

const valid = configSchema.safeParse(envConfig);
let config = {};
if (!valid.success) log(LOG_LEVEL.FATAL, valid.error);
else config = valid.data;

export default config as z.infer<typeof configSchema>;
