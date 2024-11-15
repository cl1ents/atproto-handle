const express = require('express')
const app = express()

const { JsonDB, Config } = require('node-json-db')

// Functions

const config = new Config("./data/db.json", true, true, "/");
var db = new JsonDB(config);

app.get('/.well-known/atproto-did', (req, res) => {
  db.getData(`/users/${req.hostname}`).then(value => {
    res.set('Content-Type', 'text/plain')
    res.send(value)
  }).catch(err => {
    console.error(`Tried to redirect to user @${req.hostname} but did not exist (or error occured!!)`) 
    res.status(404)
    res.send(`User "${req.hostname}" not found!`)
  })
})

app.get('/', (req, res) => {
  db.getData(`/users/${req.hostname}`).then(value => {
    console.log(`Got user @${req.hostname} with did ${value}`)
    res.redirect("https://bsky.app/profile/"+value)
  }).catch(err => {
    console.error(`Tried to redirect to user @${req.hostname} but did not exist (or error occured!!)`) 
    res.status(404)
    res.send(`User "${req.hostname}" not found!`)
  })
})

app.get('/reload', (req, res) => {
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

app.listen(3000)
console.log('Server running on port 3000')