const { GraphQLClient } = require('graphql-request')

const client = new GraphQLClient('https://gql.auslananywhere.com.au/graphql', {
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15',
    'accept-language': 'en-au'
  }
})

module.exports = client
