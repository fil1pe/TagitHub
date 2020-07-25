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

const port = process.argv.length >= 4 ? process.argv[3] : 80
const clientHost = process.argv.length >= 3 ? process.argv[2] : 'http://localhost:3000'

// For POST and PUT
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Enables cross-origin resource sharing
app.use(cors({
    origin: clientHost,
    credentials: true
}))

// For sessions
app.use(session({
    secret: secrets.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

// Authentication
app.get('/login', (req, res) => {
    res.status(200).redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`)
})

// Authentication callback function
app.get('/auth', (req, res) => {
    axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId, client_secret: clientSecret, code: req.query.code
    }, {headers: {accept: 'application/json'}})
        .then(res => res.data['access_token']).then(accessToken => {
        req.session.accessToken = accessToken
        res.status(200).redirect(clientHost)
    }).catch(err => res.status(500).json({message: err.message}))
})

// Route to log out
app.get('/logout', (req, res) => {
    if (req.session.accessToken === undefined)
        return res.status(401).json({message: 'You are not authenticated!'})
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

// Function that fetches a page of user's starred repositories
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

// Function that returns true if at least one tag contains a searched string
function filter(search, tags) {
    if (search.length === 0)
        return true
    for (let i in search)
        for (let j in tags)
            if (tags[j].includes(search[i]))
                return true
    return false
}

// Function to get a page of starred repositories based on tag search
async function taggedRepos(accessToken, page, search) {
    let res = []

    let len = 30, startPage = 1, count = 0
    while (res.length < 30 && len === 30) {
        let data = await repos(accessToken, startPage++)
        len = data.length
        for (let i in data) {
            let tags = database.getTags(data[i].title, data[i].author, accessToken)
            if (filter(search, tags))
                if (count++ >= 30 * (page - 1))
                    res.push({...data[i], tags: tags})
        }
    }

    return res
}

// Route to get user's starred repositories
app.get('/repos', (req, res) => {
    if (req.session.accessToken === undefined)
        return res.status(401).json({message: 'Authenticate!'})

    let tagStr = req.query.tags
    let tags = []
    if (tagStr !== undefined && tagStr !== '') {
        tags = tagStr.split(/[\s,]+/)
        let valid = true
        for (let i in tags)
            valid &= /^[A-Za-z0-9]+$/.test(tags[i])
        if (!valid)
            return res.status(422).json({message: 'Tags must be non-empty alphanumericals!'})
    }

    let page = parseInt(req.query.page) || 1
    if (page < 1)
        return res.status(422).json({message: 'Page must be >= 1!'})

    taggedRepos(req.session.accessToken, page, tags).then(repos => {
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
        let tags = req.body.tags
        let valid = true
        for (let i in tags)
            valid &= /^[A-Za-z0-9]+$/.test(tags[i])
        if (valid) {
            database.setTags(req.params.title, req.params.author, req.session.accessToken, tags)
            res.status(200).json({ok: true})
        } else
            res.status(422).json({message: 'Tags must be non-empty alphanumericals!'})
    } catch (err) {
        res.status(500).json({message: err.message})
    }
})

app.listen(port, function () {
    console.log(`Client host: ${clientHost}`)
    console.log(`Server running on port ${port}`)
})