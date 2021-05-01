// Bare bones Auslan Anywhere bot, for bringing Auslan Everywhere videos in to Find Sign
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
// const axios = require('axios')
// const yaml = require('yaml')

const { argv } = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'path to config json/yaml file',
    default: './config.json'
  })
  .boolean('watch')
  .option('duration', {
    alias: 'd',
    type: 'string',
    description: 'How long to watch for, if specified watch will only last this long then daemon will exit'
  })
  .option('full', {
    alias: 'f',
    type: 'boolean',
    description: 'Run until every everything is updated. If duration is specified, will exit whenever either of these are trues'
  })

const getCreatorProfile = require('./library/get-creator-profile')
getCreatorProfile('v.alford').catch((error) => console.error(error)).then(x => {
  console.log('Result:', x)
})
