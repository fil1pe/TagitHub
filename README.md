# [TagitHub]

[TagitHub] is a web app for tagging starred repositories from GitHub. Users can star their favorite repositories, and [TagitHub] will retrieve their information allowing adding them tags. Tags make it possible to reach repositories data—such as title, description and URL—through disjunctive patterns.

## Important!

[TagitHub] caches your starred repositories information for one hour due to GitHub API's rate limits. Be sure to have them in your account before accessing it!

## Tools

In order to develop [TagitHub], the following tools have been made handy:

* [node.js]
* [express.js]
* [React.js]
* [jQuery]
* [Bootstrap]
* [ClearDB MySQL]
* [Heroku]
* [JetBrains WebStorm]

plus a bunch of [node.js] packages and some design tools.

## Usage

As pointed earlier, start by starring some repositories on [GitHub]. Then lead to [TagitHub] to sign in, authenticate with your GitHub credentials and authorize [TagitHub]. You must be redirected to a page where you can see all your starred repositories. If you are not able to reach some of them, scroll down the page, and it must update with new data.

For tagging click on the pencil-like button inside the tag section of the repository you want to tag. A input must appear. Insert your tags separated by comma or space and press enter. Notice that [TagitHub] allows only alphanumeric tags.

Now you can search for repositories based on the tags you have just added! For that click on the tag buttons inside the similar repositories or use the search input in the header.

## Front-end components

The [TagitHub]'s components have been built using [React.js] and its features. The following are the most important for the app operation.

### TagInput

TagInput is a class component with some props (properties):

| prop | Description |
| —— | —————- |
| tags | Array gathering the initial tags inside the input. Must be passed by reference! |
| placeholder | The input's placeholder prop |
| onEnter(tags) | Event handler for pressing enter or clicking on the button |

The component's children are put inside the button.

In case the tag array is not passed by reference, the tags prop will be hard to change in the future. Otherwise you do not need onEnter's argument.

### Repo

This renders a given repository's information in a post-like component. It's a function with props for the data to be rendered.

| prop | Description |
| —— | —————- |
| title | Repository title |
| description | Repository description |
| author | Repository author's login |
| avatarURL | Repository author's avatar URL |
| tags | Tag array containing the repository tags. Must be passed by reference! |
| tagOnClick(tag) | Event handler for clicking on a tag |
| saveTags(tags) | Event handler for pressing enter in the TagInput |

Other rendered data—such as the author profile link—are based on the former.

### Loading animation singleton

Another class component is the animation singleton. As [React.js] updates components with no browser loading animation, users shall know when something is being fetched—otherwise they may get confused on whether [TagitHub] is loading or a bug occured. That is the purpose for this component. Built as singleton, any other component can change its visibility by getting its static instance.

### App

Last but not least, this class component fetches and renders data using the former ones. Every time it gets or sends information, a mutex is locked so that no other connection to the API is made. Inside mutual exclusion regions, the loading animation singleton is set visible until the operation is finished.

## Test

The app passed all these three tests using [enzyme] and random strings:

* Tag arrays are equal for App and the search TagInput
* Tag array is passed by reference inside any TagInput component
* Regular expression is correct for checking alphanumeric tags

## Back-end

The [node.js] back-end application implements routes to get and send data through [GitHub] API. Because of API rate limits, it caches data within a MySQL database and return its content if cache was generated 60 minutes before the request.

~~~
GET /login
~~~

Redirects to GitHub authentication page.

~~~
GET /auth
~~~

Is the authentication callback function.

~~~
GET /logout
~~~

Destroys user session.

~~~
GET /user
~~~

Reveals the authenticated user's login (username).

~~~
GET /repos?tags=T&page=P
~~~

Lists repositories based on search string T—tags separated by comma—and the offset defined by P. The list's maximum length is 30.

~~~
PUT /repos/:author/:title
~~~

Changes the tags of a given repository using the json array named tags inside the request body.

## Do not try to run it!

The app requires secret information that is not included in this repository, such as GitHub API keys.

## Database

The following table was created to cache the data:

~~~~sql
CREATE TABLE `repos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(200),
    `title` VARCHAR(200),
    `description` TEXT,
    `author` VARCHAR(200),
    `avatarURL` VARCHAR(200),
    `tags` TEXT,
    `time` BIGINT,
    PRIMARY KEY (`id`)
)
~~~~

## Images

- The icons inside buttons are all from [Bootstrap].
- The Octocat image was made by [James Kang].
- I made the loading animation using CSS and [Adobe Flash] (deprecated, I know), but [Adobe]'s plugin is not needed.

## To better

Several components may be bettered. I emphasize:

* Divide server.js into modules
* Separate the database table into two: one for repositories and the other to store the personal tags 
* Allow programming special characters for tags—e.g. +, #
* Design a better home page
* Optimize the caching mechanism
* Deep error handling and status messages

[GitHub]: <https://github.com>
[TagitHub]: <https://tagithub.herokuapp.com>
[node.js]: <https://nodejs.org>
[express.js]: <https://expressjs.com>
[React.js]: <https://reactjs.org>
[jQuery]: <https://jquery.com>
[ClearDB MySQL]: <https://devcenter.heroku.com/articles/cleardb>
[Heroku]: <https://heroku.com>
[Bootstrap]: <https://getbootstrap.com>
[JetBrains WebStorm]: <https://www.jetbrains.com/webstorm>
[Adobe Flash]: <https://www.adobe.com/products/animate.html>
[enzyme]: <https://www.npmjs.com/package/enzyme>

[James Kang]: <https://github.com/jeejkang>
[Adobe]: <https://www.adobe.com>