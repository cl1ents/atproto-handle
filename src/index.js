const { HandleResolver, DidResolver } = require('@atproto/identity')
const express = require('express')
const { JsonDB, Config } = require('node-json-db')
const path = require('path');
const { createClient } = require('./auth/client');

const app = express()

const didRes = new DidResolver({})
const handleRes = new HandleResolver({})

/* Config */
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  console.error('API_KEY is not set')
  process.exit(1)
}

const PUBLIC_DOMAINS = process.env.PUBLIC_DOMAINS.split(',')

const config = new Config("./data/db.json", true, true, "/");
var db = new JsonDB(config);


/* Functions */

/**
 * Gets the local did for a given domain
 * @param {string} domain - The domain to get the did for
 * @returns {string} The did for the given domain
 */
const getLocalDid = async (domain) => {
  const did = await db.getData(`/users/${domain}`)
  if (!did) {
    console.error(`Did not find did for domain ${domain}`)
    return null
  }
  return did
}

/**
 * Gets the local handle for a given did
 * @param {string} did 
 * @returns 
 */
const getLocalHandle = async (did) => {
  let handle
  await db.find("/users", (entry, index) => {
    if (entry === did) {
      handle = index;
      return true
    }
  })
  if (!handle) {
    return null
  }
  return handle
}

/**
 * Clears all handles for a given did
 * @param {string} did 
 * @returns 
 */
const clearAllHandles = async did => {
  await db.find("/users", (entry, index) => {
    if (entry === did) {
      db.delete(`/users/${index}`)
    }
  })
}

/**
 * Validates a did or an atproto handle and returns the resolved did
 * @param {striong} didOrHandle - The did or handle to resolve
 * @returns {string} The resolved did
 */
const validateDidOrHandleAndGetDid = async (didOrHandle) => {
  if (didOrHandle.startsWith('did:plc:')) {
    const did = await didRes.resolve(didOrHandle)
    if (!did) {
      throw `Did not resolve did ${didOrHandle}`
    }
    return did.id
  } else {
    const handle = await handleRes.resolve(didOrHandle)
    if (!handle) {
      throw `Handle not resolved ${didOrHandle}`
    }
    return handle
  }
}

/**
 * Validates a domain against the PUBLIC_DOMAINS environment variable
 * @param {string} input - The domain to validate
 * @returns {boolean} True if the domain is valid, false otherwise
 */
function validateDomain(input) {
  const regexPatterns = PUBLIC_DOMAINS.map(domain => {
    // Convert the wildcard pattern to a regex
    const escapedDomain = domain.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
    return new RegExp(`^${escapedDomain}$`);
  });

  // Check if the input matches any of the regex patterns
  return regexPatterns.some(regex => regex.test(input));
}

function validateProtectedHeaders(req) {
  return req.headers["api-key"] === API_KEY
}

/* Middleware */ 

/**
 * Middleware that checks if the request is authorized
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
const protect = (req, res, next) => {  
  if (validateProtectedHeaders(req)) {
    next()
  } else {
    res.status(401)
    res.send('Unauthorized')
  }
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS'); // Allow specific methods
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Api-Key'); // Allow specific headers

  // For preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
      res.status(204).end();
  } else {
      next();
  }
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* Routes */

/**
 * @openapi
 * /well-known/atproto-did:
 *   get:
 *     operationId: getWellKnownAtprotoDid
 *     summary: Get the did for a given domain
 *     description: Returns the did for a given domain
 *     tags:
 *       - Well-Known
 *     responses:
 *       200:
 *         description: The did for the given domain
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: The domain is not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/.well-known/atproto-did', (req, res) => {
  getLocalDid(req.hostname).then(value => {
    res.set('Content-Type', 'text/plain')
    res.send(value)
  }).catch(err => {
    console.error(`Tried to redirect to user @${req.hostname} but did not exist, error: ${err}`)
    res.status(404)
    res.send(`User "${req.hostname}" not found!`)
  })
})

/**
 * @openapi
 * /:
 *   get:
 *     operationId: redirectToBskyProfile
 *     summary: Redirect to the bsky profile for a given domain
 *     description: Redirects to the bsky profile for a given domain
 *     tags:
 *       - Public
 *     responses:
 *       302:
 *         description: Redirects to the bsky profile for the given domain
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: The domain is not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/', (req, res) => {
  getLocalDid(req.hostname).then(value => {
    console.log(`Got user @${req.hostname} with did ${value}`)
    res.redirect("https://bsky.app/profile/"+value)
  }).catch(err => {
    console.error(`Tried to redirect to user @${req.hostname} but did not exist, error: ${err}`)
    res.set('Content-Type', 'text/plain')
    res.status(404)
    res.send(`User "${req.hostname}" not found!\n${err}`)
  })
})

app.get('/available-domains', (req, res) => {
  res.send(PUBLIC_DOMAINS)
})


// Protected routes

/**
 * @openapi
 * /reload:
 *   get:
 *     operationId: reloadDb
 *     summary: Reload the db
 *     description: Reloads the db
 *     tags:
 *       - Protected
 *     responses:
 *       200:
 *         description: Reloaded the db
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to reload the db
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/reload', protect, (req, res) => {
  db.reload().then(value => {
    res.set('Content-Type', 'text/plain')
    console.log(`Reloaded db`)
    res.status(200)
    res.send('Reloaded db')
  }).catch(err => {
    res.set('Content-Type', 'text/plain')
    console.error(`Failed to reload db, error: ${err}`)

    res.set('Content-Type', 'text/plain')
    res.status(500)
    res.send(`Failed to reload db\n${err}`)
  })
})

/**
 * @openapi
 * /:
 *   delete:
 *     operationId: removeDid
 *     summary: Remove the did for the requested domain
 *     description: Removes the did for the requested domain
 *     tags:
 *       - Protected
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Removed the did
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to remove the did
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.delete('/', protect, (req, res) => {
  const domain = req.hostname

  db.delete(`/users/${domain}`).then(value => {
    console.log(`Removed did for domain ${domain}`)
    res.set('Content-Type', 'text/plain')
    res.status(200)
    res.send('Removed did')
  }).catch(err => {
    console.error(`Failed to remove did for domain ${domain}, error: ${err}`)
    
    res.set('Content-Type', 'text/plain')
    res.status(500)
    res.send(`Failed to remove did\n${err}`)
  })
})

/**
 * @openapi
 * /claim:
 *   post:
 *     operationId: claimDomain
 *     summary: Add a did for the requested domain
 *     description: Adds a did for the requested domain
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             example: "did:plc:1234567890 or yourhandle.bsky.app"
 *     responses:
 *       200:
 *         description: Added the did
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: The domain or handle is missing
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to add the did
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.post('/claim', express.text(), (req, res) => {
  const domain = req.hostname

  if (!validateDomain(domain) && !validateProtectedHeaders(req)) {
    res.set('Content-Type', 'text/plain')
    res.status(400)
    res.send(`Domain ${domain} is not allowed`)
    return
  }

  const handle = req.body
  console.log('Received text:', handle);

  if (!domain || !handle) {
    res.set('Content-Type', 'text/plain')
    res.status(400)
    res.send('Missing domain, did, or handle')
    return
  }

  getLocalDid(domain).then(localDid => {
    res.set('Content-Type', 'text/plain')
    res.status(400)
    res.send(`Domain ${domain} already has a did`)
  }).catch(err => 
    validateDidOrHandleAndGetDid(handle).then(did => getLocalHandle(did).then(handle => {
      if (handle) {
        res.set('Content-Type', 'text/plain')
        res.status(400)
        res.send(`This DID already has a handle! ${handle}`)
      } else {
        db.push(`/users/${domain}`, did).then(value => {
          console.log(`Added did for domain ${domain}`)
          res.set('Content-Type', 'text/plain')
          res.status(200)
          res.send('Added did')
        }).catch(err => {
          console.error(`Failed to add did for domain ${domain}, error: ${err}`)
          res.set('Content-Type', 'text/plain')
          res.status(500)
          res.send(`Failed to add did\n${err}`)
        })
      }
    }).catch(err => {
      console.error(err)
      res.set('Content-Type', 'text/plain')
      res.status(500)
      res.send(`Failed to add did\n${err}`)
    }))
    
  )
})

// Factory

/**
 * @openapi
 * /factory:
 *   get:
 *     operationId: factory
 *     summary: Factory
 *     description: Serves the factory page
 *     responses:
 *       200:
 *         description: The factory page
 *         content:
 *           text/html
 */
app.get('/factory', (req, res) => {
  res.sendFile(path.join(__dirname, 'factory.html'))
})

// Shredder
/**
 * @openapi
 * /factory:
 *   get:
 *     operationId: shredder
 *     summary: Shredder
 *     description: Serves the shredder page
 *     responses:
 *       200:
 *         description: The shredder page
 *         content:
 *           text/html
 */
app.get('/shredder', async (req, res) => {
  res.sendFile(path.join(__dirname, 'shredder.html'))
})
createClient(process.env.PUBLIC_URL).then(oauthClient => {

  /**
   * @openapi
   * /shredder:
   *   post:
   *     operationId: shredderPost
   *     summary: Shredder post
   *     description: Handles the shredder form
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               handle:
   *                 type: string
   *                 description: The handle to claim
   *     responses:
   *       200:
   *         description: Should redirect to the oauth client
   *         content:
   *           text/html
   */
  app.post('/shredder', async (req, res) => {
    const handle = req.body?.handle

    if (!handle) {
      res.set('Content-Type', 'text/plain')
      res.status(400)
      res.send('Missing handle')
      return
    }

    const url = await oauthClient.authorize(handle, {
      scope: 'atproto',
    })

    return res.redirect(url.toString())
  })

  /**
   * @openapi
   * /shredder/callback:
   *   get:
   *     operationId: shredderCallback
   *     summary: Shredder callback
   *     description: Handles the callback from the oauth client
   *     responses:
   *       200:
   *         description: Should redirect to the shredder page
   *         content:
   *           text/html
   */
  app.get('/shredder/callback', async (req, res) => oauthClient.callback(new URLSearchParams(req.originalUrl.split('?')[1])).then(({ session }) => {
    clearAllHandles(session.did).catch(console.error)

    return res.redirect(`/shredder?message=${encodeURIComponent("Successfully logged in! Your handle(s) should now be unclaimed.")}`)
  }).catch(err => {
    res.set('Content-Type', 'text/plain')
    res.status(500)
    res.send(`Failed to get session\n${err}`)
  }))

  /**
   * @openapi
   * /client-metadata.json:
   *   get:
   *     operationId: clientMetadata
   *     summary: Client metadata
   *     description: Returns the client metadata for the oauth client
   *     responses:
   *       200:
   *         description: The client metadata
   *         content:
   *           application/json
   */
  app.get('/client-metadata.json', (req, res) => {
    return res.json(oauthClient.clientMetadata)
  })

  app.listen(3000)
  console.log('Server running on port 3000')
})