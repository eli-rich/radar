import { Upload } from '@aws-sdk/lib-storage';
import mime from 'mime-types';
import { spawn } from 'node:child_process';
import { ReadStream, createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import config from './config.js';
import { LOG_LEVEL, log } from './logger.js';
import s3Client from './s3.js';
import { Snowflake } from './snowflake.js';

const DIR = config.WATCH_DIR;
const BASE_URL = config.BASE_URL;
const BUCKET = config.BUCKET;

type FileData = {
	key: string;
	body: ReadStream;
	contentType: string;
};

const snowflake = new Snowflake();

const pbcopy = async (text: string) => {
	return new Promise((resolve, reject) => {
		const proc = spawn('pbcopy');
		proc.on('error', reject);
		proc.on('close', resolve);
		proc.stdin?.write(text);
		proc.stdin?.end();
	});
};

const getFileData = async (name: string): Promise<FileData> => {
	const body = createReadStream(join(DIR, name));
	const contentType = mime.lookup(name) || 'application/octet-stream';
	const key = `${snowflake.slug}${extname(name) ?? ''}`;
	return { key, body, contentType };
};

const upload = async (name: string) => {
	const { key, body, contentType } = await getFileData(name);
	const target = {
		Bucket: BUCKET,
		Key: key,
		Body: body,
		ContentType: contentType,
	};
	try {
		const upload = new Upload({
			client: s3Client,
			params: target,
		});
		log(LOG_LEVEL.INFO, `Uploading ${name} to ${BUCKET}/${key}`);
		upload.on('httpUploadProgress', (progress) => {
			log(LOG_LEVEL.INFO, `Progress: ${progress.loaded}/${progress.total}`);
		});
		await upload.done();
		// copy lik to clipboard
		const link = `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}${key}`;
		await pbcopy(link);
		// delete file
		await unlink(join(DIR, name));
	} catch (err) {
		const e = err instanceof Error ? err : `WatchDir catch block triggered.\nError: ${err}`;
		log(LOG_LEVEL.WARN, e);
	}
};

export default upload;
