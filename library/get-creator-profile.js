const uri = require('uri-tag').default
const { gql } = require('graphql-request')
const client = require('./gql-client')
const simplifyVideoData = require('./simplify-video-data')

const query = gql`query ($username: String!) {
  user(where: {username: $username}) {
    id
    username
    state
    fullName
    pinnedPost {
      id
      status
      vimeoUri
      vimeoId
      published
      postPictures {
        id
        uri
        width
        height
        __typename
      }
      currentTotalViewCount
      __typename
    }
    createdPosts {
      ...Video
      __typename
    }
    __typename
  }
}

fragment Video on Post {
  id
  vimeoId
  gloss
  published
  status
  createdAt
  updatedAt
  phrase {
    id
    color
    friendlyPhrase
    posts {
      id
      published
      vimeoId
      gloss
      author {
        id
        username
        __typename
      }
      status
      __typename
    }
    topics {
      id
      topic {
        id
        friendlyName
        color
        __typename
      }
      __typename
    }
    __typename
  }
  notes
  author {
    id
    username
    fullName
    __typename
  }
  postPictures {
    id
    uri
    width
    height
    __typename
  }
  currentTotalViewCount
  __typename
}`

module.exports = async function getCreatorProfile (username) {
  const variables = { username }
  const reqHeaders = { referer: uri`https://www.auslananywhere.com.au/creators/${username}` }

  const data = await client.request(query, variables, reqHeaders)

  const profile = {
    username,
    state: data.user.state,
    author: data.user.fullName,
    posts: []
  }

  if (data.user.pinnedPost && data.user.pinnedPost.published === true && data.user.pinnedPost.status === 'PROCESSED') {
    if (Array.isArray(data.user.createdPosts)) {
      const find = data.user.createdPosts.find(x => x.id === data.user.pinnedPost.id)
      profile.bio = simplifyVideoData(find || data.user.pinnedPost)
    }
    if (!profile.bio) profile.bio = simplifyVideoData(data.user.pinnedPost)
  }

  for (const post of (data.user.createdPosts || [])) {
    const simpleVideo = simplifyVideoData(post)
    if (simpleVideo && (!profile.bio || simpleVideo.id !== profile.bio.id)) {
      profile.posts.push(simpleVideo)
    }
  }

  return profile
}
