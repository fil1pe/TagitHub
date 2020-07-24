import React from 'react'
import './TagInput.css'
import XIcon from './bootstrap-icons/x-icon'

export default class TagInput extends React.Component {

    state = {
        tags: this.props.tags
    }

    // Function that adds tag
    addTag(tag) {
        if (this.state.tags.indexOf(tag) === -1) {
            this.state.tags.push(tag)
            this.forceUpdate()
        }
    }

    // Function that adds trimmed tags from 'str' separated by space or commas
    addTags(str) {
        str.split(/[\s,]+/).forEach((item) => {
            let tag = item.trim()
            if (tag !== '')
                this.addTag(tag)
        })
    }

    // Handler for the input's onKeyUp event
    onKeyUp = (e) => {
        let inputVal = e.currentTarget.value
        // Adds tag if user pressed any of these keys
        if ((e.keyCode === 32 /* space */ || e.keyCode === 188 /* comma */ || e.keyCode === 13 /* enter */)
            && inputVal.trim() !== '') {
            this.addTags(inputVal)
            e.currentTarget.value = ''
        }
        // Calls onEnter event handler if user pressed enter
        if (e.keyCode === 13)
            this.props.onEnter(this.state.tags)
    }

    // Handler for the input's onKeyDown event
    // Removes last entered tag when backspace is pressed
    onKeyDown = (e) => {
        let inputVal = e.currentTarget.value
        if (e.keyCode === 8 && inputVal === '') {
            this.state.tags.pop()
            this.forceUpdate()
        }
    }

    // Handler for the input's onFocusOut event
    // Adds entered tag when the input loses focus
    onFocusOut = (e) => {
        this.addTags(e.currentTarget.value)
        e.currentTarget.value = ''
    }

    // Function that renders each tag
    renderTags() {
        // Function to handle click on remove buttons
        let removeTag = (tag) => {
            this.state.tags.splice(this.state.tags.indexOf(tag), 1)
            this.forceUpdate()
        }

        return this.state.tags.map(function (tag, index) {
            return <div className="tag" key={tag}>
                <span>{tag}</span>
                <button onClick={() => removeTag(tag)}>
                    <XIcon/>
                </button>
            </div>
        })
    }

    render() {
        return <div className="TagInput">
            <div>
                {this.renderTags()}
                <input type="text" placeholder={this.props.placeholder} onKeyUp={this.onKeyUp}
                       onKeyDown={this.onKeyDown} onBlur={this.onFocusOut}/>
            </div>
            <button onClick={() => this.props.onEnter(this.state.tags)}>
                {this.props.children}
            </button>
        </div>
    }
}