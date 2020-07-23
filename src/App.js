import React from 'react'
import $ from 'jquery'
import 'bootstrap/dist/js/bootstrap.js'
import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import TagInput from "./components/TagInput"
import Repo from './components/Repo'
import Octocat from './Professortocat_v2.png'
import HomeIcon from './components/bootstrap-icons/home-icon'
import ProfileIcon from './components/bootstrap-icons/profile-icon'
import SearchIcon from './components/bootstrap-icons/search-icon'

const serverHost = 'http://localhost:3001'

export default class App extends React.Component {

    state = {
        username: undefined,
        search: [],         // search tags waiting for search event
        currentSearch: [],  // search tags applied to the current search
        data: [],
        nextPage: 0,
        alert: '',
        endOfSearch: false
    }

    // Function that fetches login data from the server
    fetchLogin() {
        this.setState({username: 'fil1pe'})
    }

    // Function that fetches repository data from the server
    fetchRepos() {
        if (this.state.endOfSearch)
            return

        let data = this.state.data
        for(let i=0; i<20; i++)
            data.push({title: 'some-repository', description: 'the repository description', author: 'fil1pe',
               avatarURL: 'https://avatars3.githubusercontent.com/u/42271005?s=460&u=7836a601aabb4188d5b3810b394fe2c42b5f72d0&v=4',
               tags: ['tag1', 'tag2']})

        let alertText = ''
        let nextPage = this.state.nextPage + 1
        if (data.length === 0) {
            alertText = 'No repositories found.'
            nextPage = 0
        }

        this.setState({data: data, nextPage: nextPage, alert: alertText})
    }

    // Function to be called as the component did mount
    // and after window resized
    onResize() {
        const octocat = $('#octocat')
        let octocatWidth = octocat.width()
        octocat.css('margin-top', -(18 + octocatWidth*0.1) + 'px');
        octocat.css('margin-bottom', -(18 + octocatWidth*0.1) + 'px');
        octocat.css('margin-right', -0.3*octocatWidth + 'px');
    }

    componentDidMount() {
        this.onResize()
        window.addEventListener("resize", this.onResize)

        if (this.state.username === undefined)
            this.fetchLogin()

        // Data from next pages shall be fetched as user scrolls to the bottom
        const fetchRepos = this.fetchRepos.bind(this)
        window.addEventListener("scroll", function () {
            if($(window).scrollTop() + $(window).height() === $(document).height()) {
                fetchRepos()
            }
        })
    }

    // Function to handle search event
    search() {
        $(window).scrollTop(0)
        if (this.state.username === '')
            this.setState({alert: 'You must sign in to search your repositories.'})
        else if (this.state.username !== undefined) {
            this.setState({currentSearch: this.state.search, data: [], nextPage: 0, alert: '', endOfSearch: false},
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


        return this.state.data.map(function (item) {
            return <Repo {...item} tagOnClick={tagOnClick} saveTags={(tags) => {
                alert(tags)
            }} />
        })
    }

    render() {
        return <>
            <header>
                <nav>
                    <a className="btn" href="/">
                        <HomeIcon />
                    </a>
                    <div className="btn-group">
                        <button className="btn btn-secondary dropdown-toggle border-0"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <ProfileIcon />
                        </button>
                        { this.state.username === '' || this.state.username === undefined ?
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
                        </div> }
                    </div>
                </nav>
                <div id="header">
                    <img id="octocat" src={Octocat} alt="professortocat_v2 by jeejkang" />
                    <div id="search">
                        <TagInput placeholder="Search your starred repositories" tags={this.state.search}
                           onEnter={_ => this.search()}>
                            <SearchIcon />
                        </TagInput>
                    </div>
                </div>
            </header>
            <section>
                { this.state.alert === '' ? false :
                <div className="alert alert-warning" role="alert">
                    {this.state.alert}
                </div> }
                {this.renderRepos()}
            </section>
            <footer>Filipe Ramos 2020</footer>
        </>
    }

}
