let saveRepo = function(repo, username, page, connection) {
    let sql = `SELECT * FROM repos WHERE user = '${username}' AND author = '${repo.author}' AND title = '${repo.title}'`
    let tags = repo.tags === undefined ? [] : repo.tags
    if (repo.description === null)
        repo.description = ''

    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results, fields) => {
            if (results.length === 0)
                sql = `INSERT INTO repos(user, title, description, author, avatarURL, tags, time, page) VALUES ('${username}', '${repo.title}', ?, '${repo.author}', '${repo.avatarURL}', '${tags.join(',')}', ${new Date().getTime()}, ${page})`
            else
                sql = `UPDATE repos SET description = ?, avatarURL = '${repo.avatarURL}', time = ${new Date().getTime()}, page = ${page} WHERE id = ${results[0].id}`
            connection.query(sql, [repo.description], (error, results, fields) => {
                resolve()
            })
        })
    })
}

module.exports = {
    // Gets the stored information about repository page
    getRepos: function(username, page, connection) {
        let sql = `SELECT * FROM repos WHERE user = '${username}' AND page = ${page} AND time >= ${new Date().getTime() - 3600000} ORDER BY id ASC`

        return new Promise((resolve, reject) => {
            connection.query(sql, (error, results, fields) => {
                resolve(results)
            })
        })
    },

    // Stores some information about a repository
    saveRepo: saveRepo,

    // Saves some information about a page of repositories
    saveRepos: async function(repos, username, page, connection) {
        await saveRepo({ title: `page-${page}`, description: null, author: null, avatarURL: null }, username, page, connection)

        let promises = []
        for (let i in repos)
            promises.push(saveRepo(repos[i], username, page, connection))
        await Promise.all(promises)
    },

    // Tags a repository
    tagRepo: function(author, title, username, tags, connection) {
        let sql = `UPDATE repos SET tags = '${tags.join(',')}' WHERE user = '${username}' AND author = '${author}' AND title = '${title}'`
        return new Promise((resolve, reject) => {
            connection.query(sql, (error, results, fields) => {
                resolve()
            })
        })
    }
}