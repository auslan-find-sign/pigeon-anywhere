const uri = require('uri-tag').default
const { gql } = require('graphql-request')
const client = require('./gql-client')

module.exports = async function introspectServer () {
  const reqHeaders = { referer: uri`https://www.auslananywhere.com.au/` }

  console.log('Types:')
  const types = await client.request(gql`query {
    __schema {
      types {
        name
      }
    }
  }`, {}, reqHeaders)
  console.log(types.__schema.types.map(x => ` - ${x.name}`).sort().join('\n'))

  console.log('\n\n')

  console.log('User structure:')
  const userStructure = await client.request(gql`query {
    __type(name: "User") {
      name
      kind
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }`, {}, reqHeaders)
  console.log(userStructure.__type)

  console.log('\n\n')
  console.log('Post structure:')
  const postStructure = await client.request(gql`query {
    __type(name: "Post") {
      name
      kind
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }`, {}, reqHeaders)
  console.log(postStructure.__type)
}
