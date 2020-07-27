const secrets = require('./secrets')
const clientId = secrets.CLIENT_ID
const clientSecret = secrets.CLIENT_SECRET

const express = require('express')
const session = require('express-session')
const axios = require('axios')
const path = require('path')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const app = express()

const port = process.env.PORT || 8080
const clientHosts = ['https://tagithub.herokuapp.com', 'http://tagithub.herokuapp.com']

// For POST and PUT
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// For the React app
app.use(express.static(__dirname))
app.use(express.static(path.join(__dirname, 'build')))

// For sessions
app.use(session({
    secret: secrets.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

// For MySQL database
const connection = mysql.createConnection({
    host: secrets.DB_HOST,
    port: secrets.DB_PORT,
    user: secrets.DB_USER,
    password: secrets.DB_PASSWORD,
    database: secrets.DB_NAME
})
connection.connect((err) => {
    if (err) throw err
})

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
        res.status(200).redirect(clientHosts[0])
    }).catch(err => res.status(500).json({message: err.message}))
})

// Route to log out
app.get('/logout', (req, res) => {
    if (req.session.accessToken === undefined)
        return res.status(401).json({message: 'You are not authenticated!'})
    req.session.destroy()
    res.status(200).redirect(clientHosts[0])
})

// Function to get the authenticated user's name
function getUsername(accessToken) {
    return axios.get(`https://api.github.com/user?access_token=${accessToken}`)
        .then(res => res.data['login'])
}

// Route to get username
app.get('/user', (req, res) => {
    if (req.session.accessToken === undefined)
        return res.status(200).json({username: ''})

    getUsername(req.session.accessToken).then(username =>
        res.status(200).json({username: username})
    ).catch(err =>
        res.status(500).json({message: err.message})
    )
})

// Database functions:

// Gets the stored information about repository page
function dbGetRepos(username, page) {
    let sql = `SELECT * FROM repos WHERE user = '${username}' ORDER BY id ASC LIMIT 30 OFFSET ${30 * (page - 1)}`

    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results, fields) => {
            resolve(results)
        })
    })
}

// Stores some information about a repository
function dbSaveRepo(repo, username) {
    let sql = `SELECT * FROM repos WHERE user = '${username}' AND author = '${repo.author}' AND title = '${repo.title}'`
    let tags = repo.tags === undefined ? [] : repo.tags
    if (repo.description === null)
        repo.description = ''

    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results, fields) => {
            if (results.length === 0) {
                sql = `INSERT INTO repos(user, title, description, author, avatarURL, tags, time) VALUES ('${username}', '${repo.title}', '${repo.description}', '${repo.author}', '${repo.avatarURL}', '${tags.join(',')}', ${new Date().getTime()})`
            } else {
                console.log(results[0].id)
                sql = `UPDATE repos SET description = '${repo.description}', avatarURL = '${repo.avatarURL}', time = ${new Date().getTime()} WHERE id = ${results[0].id}`
            }
            connection.query(sql, (error, results, fields) => {
                resolve()
            })
        })
    })
}

// Saves some information about a list of repositories
async function dbSaveRepos(repos, username) {
    let promises = []
    for (let i in repos) {
        promises.push(dbSaveRepo(repos[i], username))
    }
    await Promise.all(promises)
}

// Tags a repository
function dbTagRepo(repoAuthor, repoTitle, username, tags) {
    let sql = `UPDATE repos SET tags = '${tags.join(',')}' WHERE user = '${username}' AND author = '${repoAuthor}' AND title = '${repoTitle}'`
    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results, fields) => {
            resolve()
        })
    })
}


// Function that fetches a page of user's starred repositories
async function getRepos(accessToken, username, page) {
    let repos = await dbGetRepos(username, page)
    if (repos.length > 0 && new Date().getTime() - repos[0].time <= 3600000) {
        for (let i in repos)
            repos[i].tags = repos[i].tags !== '' ? repos[i].tags.split(',') : []
        return repos
    }

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

    if (fetchedRepos.length === 0)
        return []

    await dbSaveRepos(fetchedRepos, username)

    return await getRepos(accessToken, username, page)
}

// Function that returns true if at least one tag contains a searched string
function filter(search, tags) {
    if (search.length === 0)
        return true
    for (let i in search)
        for (let j in tags)
            if (tags[j].toLowerCase().includes(search[i].toLowerCase()))
                return true
    return false
}

// Function to get a page of starred repositories based on tag search
async function getTaggedRepos(accessToken, page, search) {
    let username = await getUsername(accessToken)
    let res = []

    let len = 30, startPage = 1, count = 0, resLength = 0
    while (resLength < 30 && len === 30) {
        let data = await getRepos(accessToken, username, startPage++)
        len = data.length
        for (let i in data) {
            let tags = data[i].tags
            if (filter(search, tags))
                if (count++ >= 30 * (page - 1)) {
                    res.push({...data[i], tags: tags})
                    if (++resLength >= 30)
                        break
                }
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

    getTaggedRepos(req.session.accessToken, page, tags).then(repos => {
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
            getUsername(req.session.accessToken).then(username =>
                dbTagRepo(req.params.author, req.params.title, username, tags))
                .then(() => res.status(200).json({ok: true}))
                .catch(err => {
                    res.status(500).json({message: err.message})
                })
        } else
            res.status(422).json({message: 'Tags must be non-empty alphanumericals!'})
    } catch (err) {
        res.status(500).json({message: err.message})
    }
})

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.listen(port, function () {
    console.log(`Client host: ${clientHosts[0]}`)
    console.log(`Server running on port ${port}`)
})