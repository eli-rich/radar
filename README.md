# Radar

Upload files to a cloudflare or aws storage bucket.

## Installation

```bash
git clone https://github.com/eli-rich/radar
cd radar
pnpm install
# also should work with npm or yarn
```

## Configuration

- Create a `.env` file in the root of the project
- Add the following variables:
- `ACCOUNT_ID`: Your aws/cloudflare account id.
- `ACCESS_KEY`: Your aws/cloudflare access key.
- `SECRET_ACCESS_KEY`: Your aws/cloudflare secret access key.
- `WATCH_DIR`: The directory to watch for new files.
- `BUCKET`: The name of the bucket to upload to.
- `BASE_URL`: The base url of the public bucket.

## Usage

**Note: this has only been tested on macOS.**

To build:

```bash
pnpm build
```

To start:

```bash
pnpm start
```

To run in the background:

```bash
pnpm bg
```

To persist on reboot:

```bash
pnpm pm2 startup
# copy/paste the given command
pnpm pm2 save
```
