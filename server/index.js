const secrets = require('./secrets')
const clientId = secrets.CLIENT_ID
const clientSecret = secrets.CLIENT_SECRET

const database = require('./database')

const express = require('express')
const session = require('express-session')
const axios = require('axios')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()

const port = 3001
const clientHost = 'http://localhost:3000'

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Enables cross-origin resource sharing
app.use(cors({
    origin: clientHost,
    credentials: true
}))

// For sessions
app.use(session({secret: secrets.SESSION_SECRET}))

// Authentication
app.get('/login', (req, res) => {
    res.status(200).redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`)
})

app.get('/auth', (req, res) => {
    axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId, client_secret: clientSecret, code: req.query.code
    }, {headers: {accept: 'application/json'}})
        .then(res => res.data['access_token']).then(accessToken => {
        req.session.accessToken = accessToken
        res.status(200).redirect(clientHost)
    }).catch(err => res.status(500).json({message: err.message}))
})


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.status(200).redirect(clientHost)
})

// Route to get the authenticated user's name
app.get('/user', (req, res) => {
    if (req.session.accessToken === undefined)
        return res.status(200).json({username: ''})

    axios.get('https://api.github.com/user?access_token=' + req.session.accessToken)
        .then(res => res.data['login']).then(username =>
        res.status(200).json({username: username})
    ).catch(err =>
        res.status(500).json({message: err.message})
    )
})

// Function that fetches user's starred repositories
async function repos(accessToken, page) {
    let [repos, time] = database.getRepos(accessToken, page)
    if (repos !== undefined && new Date().getTime() - time <= 3600000)
        return repos

    let fetchedRepos = await axios.get(
        `https://api.github.com/user/starred?access_token=${accessToken}&page=${page}&per_page=30`)
        .then(res => res.data).then(data =>
            data.map(function (item) {
                return {
                    title: item.name, description: item.description, author: item.owner.login,
                    avatarURL: item.owner.avatar_url
                }
            })
        )
    database.saveRepos(fetchedRepos, accessToken, page)
    return fetchedRepos
}

// Function that returns if at least one tag contains a searched string
function filter(search, tags) {
    if (search.length === 0)
        return true
    for (let i in search)
        for (let j in tags)
            if (tags[j].includes(search[i]))
                return true
    return false
}

// Function to get a page of tagged repositories
async function taggedRepos(accessToken, page, search) {
    let res = []

    let len = 30, startPage = 1, count = 0
    while (res.length < 30 && len === 30) {
        let data = await repos(accessToken, startPage++)
        len = data.length
        for (let i in data) {
            let tags = database.getTags(data[i].title, data[i].author, accessToken)
            if (filter(search, tags))
                if (count++ >= 30 * page - 30) {
                    let copy = {...data[i]}
                    copy.tags = tags
                    res.push(copy)
                }
        }
    }

    return res
}

// Route to get user's starred repositories
app.get('/repos', (req, res) => {
    if (req.session.accessToken === undefined)
        return res.status(401).json({message: 'Authenticate!'})

    let tags = req.query.tags !== undefined && req.query.tags !== '' ? req.query.tags.split(/[\s,]+/) : []

    taggedRepos(req.session.accessToken, req.query.page || 1, tags).then(repos => {
        res.status(200).json(repos)
    }).catch(err =>
        res.status(500).json({message: err.message})
    )
})

// Route to change a repository's tags
app.put('/repos/:author/:title', (req, res) => {
    if (req.session.accessToken === undefined)
        res.status(401).json({message: 'Authenticate!'})
    try {
        database.setTags(req.params.title, req.params.author, req.session.accessToken, req.body.tags)
        res.status(200).json({ok: true})
    } catch (err) {
        res.status(500).json({message: err.message})
    }
})

app.listen(port, function () {
    console.log(`Server running on port ${port}`)
})