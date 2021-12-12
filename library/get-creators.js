const { gql } = require('graphql-request')
const client = require('./gql-client')

const browserQuery = gql`query ($not: Int!) {
  users(orderBy: {username: asc}, where: {type: CREATOR, status: ACTIVE, id: {not: $not}}) {
    id
    username
    state
    pinnedPost {
      id
      postPictures {
        id
        uri
        height
        width
        __typename
      }
      __typename
    }
    __typename
  }
}`

const efficientQuery = gql`query ($not: Int!) {
  users(orderBy: {username: asc}, where: {type: CREATOR, status: ACTIVE, id: {not: $not}}) {
    id
    username
    state
    __typename
  }
}`

module.exports = async function getCreators ({ efficient = false } = {}) {
  const variables = { not: 0 }
  const reqHeaders = { referer: 'https://www.auslananywhere.com.au/people/' }

  const data = await client.request(efficient ? efficientQuery : browserQuery, variables, reqHeaders)

  return data.users.map(user => {
    return {
      id: user.id,
      username: user.username,
      state: user.state
    }
  })
}
