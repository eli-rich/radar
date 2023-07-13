import { S3Client } from '@aws-sdk/client-s3';
import config from './config.js';

const ACCOUNT_ID = config.ACCOUNT_ID;
const ACCESS_KEY = config.ACCESS_KEY;
const SECRET_KEY = config.SECRET_KEY;

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: ACCESS_KEY,
		secretAccessKey: SECRET_KEY,
	},
});

export default s3Client;
