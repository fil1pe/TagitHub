import React from 'react'
import { mount, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import TagInput from './components/TagInput'
import App from './App'

configure({ adapter: new Adapter() })

// Generates random integer from [min, max)
const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min)) + min

// Generates random string of length len
const randomStr = (len) => {
    let str = ''
    for (let i=0; i<len; i++)
        str += String.fromCharCode(randomInt(0, 128))
    return str
}

window.scrollTo = jest.fn()

it('tag arrays are equal for search input and App', () => {
    window.scrollTo.mockClear()

    const wrapper = mount(<App />)
    const searchInput = wrapper.find('#search').find(TagInput)

    // Checks for 100 random strings
    for (let i=0; i<100; i++) {
        // Changes input value to a random string of length 10000
        searchInput.find('input').instance().value = randomStr(10000)
        // Simulates Enter pressing
        searchInput.find('input').simulate('keypress', {keyCode: 13})
        searchInput.find('input').simulate('keydown', {keyCode: 13})
        searchInput.find('input').simulate('keyup', {keyCode: 13})

        expect(wrapper.state().search).toEqual(searchInput.state().tags)
    }
})

it('tag array is passed by reference', () => {
    const tagArray = []
    // Adds 10 random alphanumeric strings
    for (let i=0; i<10; i++)
        tagArray.push(Math.random().toString(36).substring(7))

    const wrapper = mount(<TagInput tags={tagArray} onEnter={() => {}} />)

    // Checks for 100 random strings
    for (let i=0; i<100; i++) {
        // Changes input value to a random string of length 10000
        wrapper.find('input').instance().value = randomStr(10000)
        // Simulates Enter pressing
        wrapper.find('input').simulate('keypress', {keyCode: 13})
        wrapper.find('input').simulate('keydown', {keyCode: 13})
        wrapper.find('input').simulate('keyup', {keyCode: 13})

        expect(tagArray).toEqual(wrapper.state().tags)
    }
})

it('validated tags are alphanumeric', () => {
    const possibleChars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
        "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

    // Checks for 1000 random strings
    for (let i=0; i<1000; i++) {
        let tagArray = []
        let wrapper = mount(<TagInput tags={tagArray} onEnter={() => {}} />)
        // Changes input value to a random string of length 10000
        wrapper.find('input').instance().value = randomStr(10000)
        // Simulates Enter pressing
        wrapper.find('input').simulate('keypress', {keyCode: 13})
        wrapper.find('input').simulate('keydown', {keyCode: 13})
        wrapper.find('input').simulate('keyup', {keyCode: 13})

        // Checks if every tag is alphanumeric
        for (let j in tagArray)
            for (let k in tagArray[j])
                expect(possibleChars.includes(tagArray[j][k])).toBeTruthy()
    }
})
