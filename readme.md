# atproto-handle

This is a simple express server that will redirect users to their bsky profile based on their hostname.

## Usage

I haven't put this on the docker hub yet, so you'll have to build it yourself.

1. Clone this repo
2. Create a `data` folder in the root of the project
3. Create a `db.json` file in the root of the project with the following structure:
```json
{
    "users": {
        "domain.example.com": "did:plc:your-did",
        "another.example.com": "did:plc:another-did"
    }
}
```
3. Run the following command to build & deploy the app as a docker container
```bash
docker compose up --build -d
```

Then you can access it at `localhost:3000`

You can expose your server to `*.your-domain.com` & `your-domain.com` in order to use any domain you own on the bsky network.

## API Documentation

For detailed API documentation, see [API.md](./API.md).

## TODO
- [ ] Frontend