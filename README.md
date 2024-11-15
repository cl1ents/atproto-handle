# atproto-handle

This is a simple express server that will redirect users to their bsky profile based on their hostname.

## Why?

Honestly this was mostly for practice. I know for a fact a project like this already exists, but I wanted to learn more about how express works, and how the atproto identity resolvers work.

## Usage

I haven't put this on the docker hub yet, so you'll have to build it yourself.

1. Clone this repo
2. Create a `data` folder in the root of the project
3. Create a `db.json` file in the root of the project with the following structure (or you can use the exposed `/claim` endpoint to add dids, see the API documentation for more info):
```json
{
    "users": {
        "domain.example.com": "did:plc:your-did",
        "another.example.com": "did:plc:another-did"
    }
}
```
3. Copy the `example.env` file to `.env` and fill in the values (ESPECIALLY THE API_KEY!!)
4. Run the following command to build & deploy the app as a docker container
```bash
docker compose up --build -d
```

Then you can access it at `localhost:3000`

You can expose your server to `*.your-domain.com` & `your-domain.com` in order to use any domain you own on the bsky network.

## API Documentation

For detailed API documentation, see [API.md](./API.md).

## TODO
- [ ] Frontend