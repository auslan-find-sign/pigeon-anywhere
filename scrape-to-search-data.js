// Bare bones Auslan Anywhere bot, for bringing Auslan Everywhere videos in to Find Sign
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { pipeline } = require('stream/promises')
const yaml = require('yaml')
const uri = require('uri-tag').default
const youtubedl = require('youtube-dl-exec')

const knownVideos = new Set()

const { argv } = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    default: '-',
    description: 'filename to input yaml stream, or - for stdin'
  })
  .option('video-folder', {
    type: 'string',
    default: 'videos',
    description: 'path, relative to output, where videos should be written'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: '-',
    description: 'filename to output json stream, or - for stdout'
  })

function transform (videoFolder) {
  return async function * transform (input) {
    for await (const profile of input) {
      const { username, state, author, posts } = profile.data
      for (const post of posts) {
        const { id, url: vimeoURL, gloss, notes, title } = post

        const videoFilename = `${id}.mp4`
        const videoPath = `${videoFolder}/${videoFilename}`
        knownVideos.add(videoFilename)
        if (!fs.existsSync(videoPath)) {
          console.info('downloading', vimeoURL, `for #${id} by ${username}`)
          const ytdlRes = await youtubedl(vimeoURL, {
            noCheckCertificate: true,
            output: videoPath,
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
            referer: uri`https://www.auslananywhere.com.au/feed/${id}`
          })
        }

        yield {
          id: `${id}`,
          title,
          link: uri`https://www.auslananywhere.com.au/feed/${id}`,
          nav: [
            ['Auslan Anywhere', 'https://www.auslananywhere.com.au/'],
            [author, uri`https://www.auslananywhere.com.au/creators/${username}`],
            [title, uri`https://www.auslananywhere.com.au/feed/${id}`]
          ],
          author: {
            name: author,
            link: uri`https://www.auslananywhere.com.au/creators/${username}`
          },
          tags: ['auslan-anywhere', state.toLowerCase(), username],
          body: `Gloss: ${gloss}\n${notes}`,
          media: [{ method: 'fetch', url: videoPath}],
          timestamp: Date.parse(post.createdAt)
        }
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
  await fsp.mkdir(argv.videoFolder, { recursive: true })

  await pipeline(
    argv.input === '-' ? process.stdin : fs.createReadStream(argv.input),
    decodeYamlDocs,
    transform(argv.videoFolder),
    encodeJsonDocs,
    argv.output === '-' ? process.stdout : fs.createWriteStream(argv.output)
  )

  // cleanup orphaned mp4's
  const filenames = await fsp.readdir(argv.videoFolder)
  for (const filename of filenames) {
    if (!knownVideos.has(filename)) {
      await fsp.rm(path.join(argv.videoFolder, filename))
    }
  }
}

run()
