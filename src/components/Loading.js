import React from 'react'
import './Loading.css'

// Singleton implementation for a loading animation
export default class Loading extends React.Component {

    static instance = null
    state = {
        visible: true
    }

    constructor(props) {
        super(props)

        if (Loading.instance !== null)
            throw "Loading singleton instance already exists"

        Loading.instance = this
    }

    // Function that changes component visibility
    setVisible(visible) {
        this.setState({visible: visible})
    }

    render() {
        return <>
            <div id="Loading-container" style={{display: this.state.visible ? 'flex' : 'none'}}>
                <div></div>
            </div>
        </>
    }

}