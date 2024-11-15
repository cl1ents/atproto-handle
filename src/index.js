const express = require('express')
const app = express()

const { JsonDB, Config } = require('node-json-db')

/* Config */
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  console.error('API_KEY is not set')
  process.exit(1)
}

const IS_PUBLIC = process.env.IS_PUBLIC === 'true'

const config = new Config("./data/db.json", true, true, "/");
var db = new JsonDB(config);

app.use(express.json())

/* Functions */
const getDid = async (domain) => {
  const did = await db.getData(`/users/${domain}`)
  if (!did) {
    console.error(`Did not find did for domain ${domain}`)
    return null
  }
  return did
}

/* Middleware & Routers */ 
const protected = express.Router()

protected.use(function(req, res, next) {
  if (!IS_PUBLIC && req.headers.authorization !== `Bearer ${API_KEY}`) {
    res.status(401)
    res.send('Unauthorized')
  } else {
    next()
  }
})

/* Routes */
app.get('/.well-known/atproto-did', (req, res) => {
  getDid(req.hostname).then(value => {
    res.set('Content-Type', 'text/plain')
    res.send(value)
  }).catch(err => {
    console.error(`Tried to redirect to user @${req.hostname} but did not exist (or error occured!!)`) 
    res.status(404)
    res.send(`User "${req.hostname}" not found!`)
  })
})

app.get('/', (req, res) => {
  getDid(req.hostname).then(value => {
    console.log(`Got user @${req.hostname} with did ${value}`)
    res.redirect("https://bsky.app/profile/"+value)
  }).catch(err => {
    console.error(`Tried to redirect to user @${req.hostname} but did not exist (or error occured!!)`) 
    res.status(404)
    res.send(`User "${req.hostname}" not found!`)
  })
})

// Protected routes
protected.get('/reload', (req, res) => {
  db.reload().then(value => {
    console.log(`Reloaded db`)
    res.status(200)
    res.send('Reloaded db')
  }).catch(err => {
    console.error(`Failed to reload db`)
    res.status(500)
    res.send('Failed to reload db')
  })
})
protected.post('/add', (req, res) => {
  const domain = req.body.domain
  const did = req.body.did // TODO: validate did
  if (!domain || !did) {
    res.status(400)
    res.send('Missing domain or did')
    return
  }
  db.setData(`/users/${domain}`, did).then(value => {
    console.log(`Added did for domain ${domain}`)
    res.status(200)
    res.send('Added did')
  }).catch(err => {
    console.error(`Failed to add did for domain ${domain}`)
    res.status(500)
    res.send('Failed to add did')
  })
})

app.listen(3000)
console.log('Server running on port 3000')