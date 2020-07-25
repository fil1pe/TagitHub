import React from 'react'
import $ from 'jquery'
import Axios from 'axios'
import {Mutex} from 'async-mutex'
import 'bootstrap/dist/js/bootstrap.js'
import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import TagInput from "./components/TagInput"
import Repo from './components/Repo'
import Octocat from './Professortocat_v2.png'
import HomeIcon from './components/bootstrap-icons/home-icon'
import ProfileIcon from './components/bootstrap-icons/profile-icon'
import SearchIcon from './components/bootstrap-icons/search-icon'
import Loading from './components/Loading'

const serverHost = 'https://tagithub-api.herokuapp.com'
const mutex = new Mutex()

export default class App extends React.Component {

    state = {
        username: undefined,
        search: [],         // search tags waiting for search event
        currentSearch: [],  // search tags applied to the current search
        data: [],
        nextPage: 1,
        alert: '',
        endOfSearch: false
    }

    // Function that waits 'time' ms (useful for animation)
    sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    // Function that fetches login data from the server
    async fetchLogin() {
        const release = await mutex.acquire()

        try {

            this.setLoading(true)

            let username = await Axios.get(`${serverHost}/user`, {withCredentials: true})
                .then(res => res.data.username)
                .catch(err => {
                    this.setState({alert: err.message})
                    return ''
                })

            this.setState({username: username}, this.fetchRepos)

        } catch (err) {
            console.log(err)
        } finally {
            release()
            await this.sleep(300)
            this.setLoading(false)
        }
    }

    // Function that fetches repository data from the server
    async fetchRepos() {
        const release = await mutex.acquire()

        try {

            // If no user is logged in or end of search has been reached, it will not try to fetch data
            if (this.state.endOfSearch || this.state.username === undefined || this.state.username === '')
                return

            this.setLoading(true)

            let data = await Axios.get(
                `${serverHost}/repos?page=${this.state.nextPage}&tags=${this.state.currentSearch.join(',')}`,
                {withCredentials: true})
                .then(res => res.data).catch(err => {
                    return []
                })

            // End of search is reached when fetched data length is less than a page length (30)
            let endOfSearch = data.length < 30
            let nextPage = endOfSearch ? this.state.nextPage : this.state.nextPage + 1
            data = this.state.data.concat(data)
            let _alert = data.length === 0 ? 'No repositories found' : ''

            this.setState({data: data, nextPage: nextPage, alert: _alert, endOfSearch: endOfSearch})

        } catch (err) {
            console.log(err)
        } finally {
            release()
            await this.sleep(300)
            this.setLoading(false)
        }
    }

    // Function to send repository tags
    async send(title, author, tags) {
        const release = await mutex.acquire()

        try {

            this.setLoading(true)
            await Axios.put(`${serverHost}/repos/${author}/${title}`, {tags: tags}, {withCredentials: true})

        } catch (err) {
            console.log(err)
        } finally {
            release()
            await this.sleep(300)
            this.setLoading(false)
        }
    }

    // Function to be called as the component did mount
    // and after window resized
    onResize() {
        const octocat = $('#octocat')
        let octocatWidth = octocat.width()
        octocat.css('margin-top', -(18 + octocatWidth * 0.1) + 'px');
        octocat.css('margin-bottom', -(18 + octocatWidth * 0.1) + 'px');
        octocat.css('margin-right', -0.3 * octocatWidth + 'px');
    }

    componentDidMount() {
        this.onResize()
        window.addEventListener("resize", this.onResize)

        if (this.state.username === undefined)
            this.fetchLogin()

        // Data from next pages shall be fetched as user scrolls to the bottom
        window.addEventListener("scroll", () => {
            if ($(window).scrollTop() + $(window).height() === $(document).height())
                this.fetchRepos()
        })
    }

    // Function to handle search event
    search() {
        $(window).scrollTop(0)
        if (this.state.username === '')
            this.setState({alert: 'You must sign in to search your repositories.'})
        else if (this.state.username !== undefined) {
            this.setState({currentSearch: this.state.search, data: [], nextPage: 1, alert: '', endOfSearch: false},
                () => this.fetchRepos())
        }
    }

    // Function that renders each repository article
    renderRepos() {
        const tagOnClick = (tag) => {
            // Empties state search
            // eslint-disable-next-line
            this.state.search.length = 0
            // Adds tag to state
            this.state.search.push(tag)
            this.search()
        }

        let count = 0
        return this.state.data.map(item => {
            return <Repo key={count++} {...item} tagOnClick={tagOnClick} saveTags={(tags) =>
                this.send(item.title, item.author, tags)
            }/>
        })
    }

    // Function to show or hide loading animation
    setLoading(visible) {
        const LoadingSingleton = Loading.instance
        if (LoadingSingleton !== null)
            LoadingSingleton.setVisible(visible)
    }

    render() {
        return <>
            <header>
                <nav>
                    <a className="btn" href="/">
                        <HomeIcon/>
                    </a>
                    <div className="btn-group">
                        <button className="btn btn-secondary dropdown-toggle border-0"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <ProfileIcon/>
                        </button>
                        {this.state.username === '' || this.state.username === undefined ?
                            <div className="dropdown-menu dropdown-menu-right">
                                <a className="dropdown-item" href={`${serverHost}/login`}>
                                    Sign in with GitHub
                                </a>
                            </div> :
                            <div className="dropdown-menu dropdown-menu-right">
                                <a className="dropdown-item" href={`https://github.com/${this.state.username}`}
                                   target="_blank" rel="noopener noreferrer">
                                    Go to your page
                                </a>
                                <a className="dropdown-item" href={`${serverHost}/logout`}>Sign out</a>
                            </div>}
                    </div>
                </nav>
                <div id="header">
                    <img id="octocat" src={Octocat} alt="professortocat_v2 by jeejkang"/>
                    <div id="search">
                        <TagInput placeholder="Search your starred repositories" tags={this.state.search}
                                  onEnter={() => this.search()}>
                            <SearchIcon/>
                        </TagInput>
                    </div>
                </div>
            </header>
            <section>
                {this.state.alert === '' ? false :
                    <div className="alert alert-warning" role="alert">
                        {this.state.alert}
                    </div>}
                {this.renderRepos()}
            </section>
            <footer>Filipe Ramos 2020</footer>
        </>
    }

}
