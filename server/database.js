// To store the tags
exports.tagDatabase = {}
// To store the repositories
exports.repoDatabase = {}

// Gets the tags of a repository
exports.getTags = function (repoTitle, author, accessToken) {
    if (accessToken in this.tagDatabase && author in this.tagDatabase[accessToken] &&
        repoTitle in this.tagDatabase[accessToken][author])
        return this.tagDatabase[accessToken][author][repoTitle]

    return []
}

// Sets tags for a repository
exports.setTags = function (repoTitle, author, accessToken, tags) {
    if (!(accessToken in this.tagDatabase))
        this.tagDatabase[accessToken] = {}
    if (!(author in this.tagDatabase[accessToken]))
        this.tagDatabase[accessToken][author] = {}

    this.tagDatabase[accessToken][author][repoTitle] = tags
}

// Gets stored repositories
exports.getRepos = function (accessToken, page) {
    if (accessToken in this.repoDatabase && page in this.repoDatabase[accessToken])
        return [this.repoDatabase[accessToken][page].repos, this.repoDatabase[accessToken][page].time]

    return [undefined, undefined]
}

// Stores repositories
exports.saveRepos = function (repos, accessToken, page) {
    if (!(accessToken in this.repoDatabase))
        this.repoDatabase[accessToken] = {}
    if (!(page in this.repoDatabase[accessToken]))
        this.repoDatabase[accessToken][page] = {}

    this.repoDatabase[accessToken][page].repos = repos
    this.repoDatabase[accessToken][page].time = new Date().getTime()
}