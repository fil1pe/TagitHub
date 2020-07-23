import React from 'react'
import $ from 'jquery'
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
    let tags = props.tags || []

    let tagElements = tags.map(function (tag) {
        return <button className="tag">
            {tag}
        </button>
    })

    return <article className="Repo">
        <section>
            <a className="title" href={repoURL} target="_blank" rel="noopener noreferrer">{title}</a>
            <div className="description">{description}</div>
            <div className="tags-container">
                {tagElements}
                <button className="edit" onClick={(e) => {
                    // Hides tag container
                    let tagsContainer = e.currentTarget.parentNode
                    $(tagsContainer).css('display', 'none')
                    // Shows form
                    $(tagsContainer.parentNode).find('.tags-form').css('display', 'block')
                }}>
                    <EditIcon />
                </button>
            </div>
            <div className="tags-form">
                <div>
                    <TagInput placeholder="Add tags" tags={tags} >
                        <OkIcon />
                    </TagInput>
                </div>
            </div>
        </section>
        <aside>
            <a href={profileURL} target="_blank" rel="noopener noreferrer" style={{backgroundImage: avatarURL}}
               onMouseEnter={(e) => {
                   // Shows author name on mouse enter avatar
                   let aside = e.currentTarget.parentNode
                   $(aside).find('div').css('display', 'flex')
               }}
               onMouseLeave={(e) => {
                   // Hides author name on mouse leave avatar
                   let aside = e.currentTarget.parentNode
                   $(aside).find('div').css('display', 'none')
               }} />
            <div>{author}</div>
        </aside>
    </article>

}