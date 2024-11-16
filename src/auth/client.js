const { NodeOAuthClient } = require('@atproto/oauth-client-node')



const createClient = async (publicUrl) => {
    const url = publicUrl || "http://127.0.0.1:3000"
    const enc = encodeURIComponent

    const sessionStore = {
        db: new Map(),
        time: new Map(),

        async get(sub) {
            return this.db.get(sub);
        },
        async set(sub, session) {
            this.time.set(sub, Date.now());
            this.db.set(sub, session);
        },
        async del(sub) {
            this.db.delete(sub);
        }
      }

    const stateStore = {
        db: new Map(),
        time: new Map(),

        async get(sub) {
            // Check if state is expired (1hr)
            const time = this.time.get(sub);
            if (time && Date.now() - time > 3600000) {
                this.del(sub);
                return null;
            }
            return this.db.get(sub);
        },
        async set(sub, state) {
            this.time.set(sub, Date.now());
            this.db.set(sub, state);
        },
        async del(sub) {
            this.db.delete(sub);
        }
    }

    setInterval(() => {
        // Clear expired states
        for (const [sub, time] of stateStore.time) {
            if (time < Date.now() - 3600000) {
                stateStore.db.delete(sub)
                stateStore.time.delete(sub)
            }
        }

        // Clear expired sessions
        for (const [sub, time] of sessionStore.time) {
            if (time < Date.now() - 3600000) {
                sessionStore.db.delete(sub)
                sessionStore.time.delete(sub)
            }
        }
    }, 3600000)

    return new NodeOAuthClient({
        clientMetadata: {
            client_name: "atproto-handle shredder",
            client_id: publicUrl
            ? `${url}/client-metadata.json`
            : `http://localhost?redirect_uri=${enc(`${url}/shredder/callback`)}&scope=${enc('atproto')}`,
            client_uri: url,
            redirect_uris: [`${url}/shredder/callback`],
            grant_types: ['authorization_code'],
            scope: 'atproto',
            response_types: ['code'],
            application_type: 'web',
            token_endpoint_auth_method: 'none',
            dpop_bound_access_tokens: true,
        }, 
        sessionStore, 
        stateStore
    })
}

module.exports = {
    createClient
}