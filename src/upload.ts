import { Upload } from '@aws-sdk/lib-storage';
import mime from 'mime-types';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
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

const snowflake = new Snowflake(config.MACHINE_ID);

const copy = async (text: string) => {
	return new Promise((resolve, reject) => {
		let proc: ChildProcessWithoutNullStreams;

		if (process.platform === 'darwin') {
			proc = spawn('pbcopy');
		} else if (process.platform === 'linux') {
			// Check if Wayland is being used
			const isWayland = process.env.XDG_SESSION_TYPE === 'wayland';
			if (isWayland) {
				proc = spawn('wl-copy');
			} else {
				proc = spawn('xclip', ['-selection', 'clipboard']);
			}
		} else {
			reject(new Error('Unsupported platform for clipboard operations'));
			return;
		}

		proc.on('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'ENOENT') {
				reject(
					new Error(
						`Clipboard utility not found. Please install ${
							process.platform === 'darwin'
								? 'pbcopy'
								: process.env.XDG_SESSION_TYPE === 'wayland'
								? 'wl-clipboard'
								: 'xclip'
						}`,
					),
				);
			} else {
				reject(err);
			}
		});
		proc.on('close', (code) => {
			if (code === 0) {
				resolve(undefined);
			} else {
				reject(new Error(`Clipboard operation failed with code ${code}`));
			}
		});
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
		await copy(link);
		// delete file
		await unlink(join(DIR, name));
	} catch (err) {
		const e = err instanceof Error ? err : `WatchDir catch block triggered.\nError: ${err}`;
		log(LOG_LEVEL.WARN, e);
	}
};

export default upload;
