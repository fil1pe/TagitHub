// To store the tags
exports.tagDatabase = {}
// To store the repositories
exports.repoDatabase = {}

// Gets the tags of a repository
exports.getTags = function (repoTitle, author, username) {
    if (username in this.tagDatabase && author in this.tagDatabase[username] &&
        repoTitle in this.tagDatabase[username][author])
        return this.tagDatabase[username][author][repoTitle]

    return []
}

// Sets tags for a repository
exports.setTags = function (repoTitle, author, username, tags) {
    if (!(username in this.tagDatabase))
        this.tagDatabase[username] = {}
    if (!(author in this.tagDatabase[username]))
        this.tagDatabase[username][author] = {}

    this.tagDatabase[username][author][repoTitle] = tags
}

// Gets stored repositories
exports.getRepos = function (username, page) {
    if (username in this.repoDatabase && page in this.repoDatabase[username])
        return [this.repoDatabase[username][page].repos, this.repoDatabase[username][page].time]

    return [undefined, undefined]
}

// Stores repositories
exports.saveRepos = function (repos, username, page) {
    if (!(username in this.repoDatabase))
        this.repoDatabase[username] = {}
    if (!(page in this.repoDatabase[username]))
        this.repoDatabase[username][page] = {}

    this.repoDatabase[username][page].repos = repos
    this.repoDatabase[username][page].time = new Date().getTime()
}