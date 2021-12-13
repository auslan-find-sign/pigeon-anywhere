// Bare bones Auslan Anywhere bot, for bringing Auslan Everywhere videos in to Find Sign
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs')
const { pipeline } = require('stream/promises')
const yaml = require('yaml')
const uri = require('uri-tag').default

const { argv } = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    default: '-',
    description: 'filename to input yaml stream, or - for stdin'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: '-',
    description: 'filename to output json stream, or - for stdout'
  })

async function * transform (input) {
  for await (const profile of input) {
    const { username, state, author, posts } = profile.data
    for (const post of posts) {
      const { id, url: vimeoURL, gloss, notes, title } = post
      yield {
        id: `${id}`,
        title,
        link: uri`https://www.auslananywhere.com.au/feed/${id}`,
        nav: [
          ['Auslan Anywhere', 'https://www.auslananywhere.com.au/'],
          [author, uri`https://www.auslananywhere.com.au/creators/${username}`],
          [title, uri`https://www.auslananywhere.com.au/feed/${id}`]
        ],
        tags: ['auslan-anywhere', state.toLowerCase(), username],
        body: `Gloss: ${gloss}\n${notes}`,
        videos: [{ method: 'youtube-dl', url: vimeoURL }],
        timestamp: Date.parse(post.createdAt)
      }
    }
  }
}

// streaming yaml document parser
async function * decodeYamlDocs (iter) {
  let buffer = Buffer.alloc(0)

  for await (const chunk of iter) {
    buffer = Buffer.concat([buffer, chunk])
    let offset
    while ((offset = buffer.indexOf('\n...')) >= 0) {
      // slice off the first document from the buffer
      const lineSlice = buffer.slice(0, offset + 1)
      const docText = lineSlice.toString('utf-8')
      buffer = buffer.slice(offset + 5)
      yield yaml.parse(docText)
    }
  }
}

// streaming yaml document encoder
async function * encodeJsonDocs (iterator) {
  yield '['
  let first = true
  for await (const entry of iterator) {
    if (!first) yield ','
    first = false
    yield JSON.stringify(entry) + ''
  }
  yield ']'
}

async function run () {
  await pipeline(
    argv.input === '-' ? process.stdin : fs.createReadStream(argv.input),
    decodeYamlDocs,
    transform,
    encodeJsonDocs,
    argv.output === '-' ? process.stdout : fs.createWriteStream(argv.output)
  )
}

run()
