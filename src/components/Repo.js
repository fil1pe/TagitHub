import React, {useState} from 'react'
import './Repo.css'
import TagInput from './TagInput'
import EditIcon from './bootstrap-icons/edit-icon'
import OkIcon from './bootstrap-icons/ok-icon'

export default props => {

    let title = props.title
    let description = props.description
    let author = props.author
    let avatarURL = `url(${props.avatarURL})`
    let profileURL = `https://github.com/${author}`
    let repoURL = `${profileURL}/${title}`
    let tags = props.tags

    // If user clicks on edit button, setEditing hides tag container and shows form
    const [editing, setEditing] = useState(false)
    // If mouse enters avatar, setAuthorVisible shows author name
    const [authorVisible, setAuthorVisible] = useState(false)

    const tagElements = tags.map(function (tag) {
        return <button className="tag" onClick={_ => props.tagOnClick(tag)}>
            {tag}
        </button>
    })

    return <article className="Repo">
        <section>
            <a className="title" href={repoURL} target="_blank" rel="noopener noreferrer">{title}</a>
            <div className="description">{description}</div>
            { editing ?
            <div className="tags-form">
                <div>
                    <TagInput placeholder="Add tags" tags={tags} onEnter={_ => {
                        setEditing(false)
                        props.saveTags(tags)
                    }}>
                        <OkIcon />
                    </TagInput>
                </div>
            </div> :
            <div className="tags-container">
                {tagElements}
                <button className="edit" onClick={_ => setEditing(true)}>
                    <EditIcon />
                </button>
            </div> }
        </section>
        <aside>
            <a href={profileURL} target="_blank" rel="noopener noreferrer" style={{backgroundImage: avatarURL}}
               onMouseEnter={_ => setAuthorVisible(true)} onMouseLeave={_ => setAuthorVisible(false)}>
                {author}
            </a>
            { authorVisible ? <div>{author}</div> : false }
        </aside>
    </article>

}