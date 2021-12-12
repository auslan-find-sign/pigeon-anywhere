// Bare bones Auslan Anywhere bot, for bringing Auslan Everywhere videos in to Find Sign
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const getCreators = require('./library/get-creators')
const getCreatorProfile = require('./library/get-creator-profile')
const fetch = require('node-fetch').default
const fs = require('fs')
const { Readable } = require('stream')
const yaml = require('yaml')

const { argv } = yargs(hideBin(process.argv))
  .option('profile', {
    alias: 'p',
    type: 'string',
    description: 'username to spider'
  })
  .option('all-creators', {
    alias: 'a',
    type: 'boolean',
    description: 'Grab all the creator profiles'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: '-',
    description: 'Either a local filesystem path to a file to output in yaml multiple documents format compatible with pigeon-optics, or a http/https url to PUT the data to'
  })

// iterates through remote server's data
async function * dataIter () {
  if (argv['all-creators']) {
    const users = (await getCreators()).map(x => x.username)
    for (const username of users) {
      const profile = await getCreatorProfile(username)
      yield { id: profile.username, data: profile }
    }
  } else if (argv.profile) {
    const profile = await getCreatorProfile(argv.profile)
    yield profile
  }
}

async function * yamlStream (iterator) {
  for await (const entry of iterator) {
    yield yaml.stringify(entry) + '...\n'
  }
}

async function run () {
  if (argv.profile && argv['all-creators']) {
    throw new Error('cannot use --profile and --all-creators together')
  }

  const stream = Readable.from(await yamlStream(await dataIter()))

  if (argv.output === '-') {
    // stdout
    stream.pipe(process.stdout)
  } else if (argv.output.startsWith('http://') || argv.output.startsWith('https://')) {
    const res = await fetch(argv.output, {
      body: stream,
      method: 'PUT'
    })

    console.info(`Server response: ${res.status}`)
    console.info(await res.text())
  } else {
    stream.pipe(fs.createWriteStream(argv.output))
  }
}

run()
