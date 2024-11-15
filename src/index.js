const { HandleResolver } = require('@atproto/identity')
const { DidResolver } = require('@atproto/identity')
const express = require('express')
const { JsonDB, Config } = require('node-json-db')

const app = express()

const didRes = new DidResolver({})
const handleRes = new HandleResolver({})

/* Config */
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  console.error('API_KEY is not set')
  process.exit(1)
}

const IS_PUBLIC = process.env.IS_PUBLIC === 'true'

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

/* Middleware */ 

/**
 * Middleware that checks if the request is authorized
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
const protect = (req, res, next) => {  
  if (req.headers["api-key"] !== API_KEY) {
    res.status(401)
    res.send('Unauthorized')
  } else {
    next()
  }
}

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
    console.error(`Tried to redirect to user @${req.hostname} but did not exist (or error occured!!)`) 
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
    console.error(`Tried to redirect to user @${req.hostname} but did not exist (or error occured!!)`) 
    res.status(404)
    res.send(`User "${req.hostname}" not found!`)
  })
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
    console.error(`Failed to reload db`)
    res.status(500)
    res.send('Failed to reload db')
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
    console.error(`Failed to remove did for domain ${domain}`)
    res.set('Content-Type', 'text/plain')
    res.status(500)
    res.send('Failed to remove did')
  })
})

/**
 * @openapi
 * /claim:
 *   post:
 *     operationId: claimDomain
 *     summary: Add a did for the requested domain
 *     description: Adds a did for the requested domain
 *     tags:
 *       - Protected
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             example: "did:plc:1234567890 or yourhandle.bsky.app"
 *     security:
 *       - ApiKeyAuth: []
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
app.post('/claim', IS_PUBLIC ? (a,b,next) => next() : protect, (req, res) => {
  const domain = req.hostname
  const handle = req.body

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
  }).catch(err => {
    validateDidOrHandleAndGetDid(handle).then(did => {
      db.push(`/users/${domain}`, did).then(value => {
        console.log(`Added did for domain ${domain}`)
        res.set('Content-Type', 'text/plain')
        res.status(200)
        res.send('Added did')
      }).catch(err => {
        console.error(`Failed to add did for domain ${domain}`)
        res.set('Content-Type', 'text/plain')
        res.status(500)
        res.send('Failed to add did')
      })
    })
  })
})

app.listen(3000)
console.log('Server running on port 3000')