const uri = require('uri-tag').default

module.exports = function simplifyVideoData (post) {
  if (post.published !== true) return undefined
  if (post.status !== 'PROCESSED') return undefined
  const output = {
    id: post.id,
    url: uri`https://vimeo.com/${post.vimeoId}`,
    vimeoID: post.vimeoId,
    gloss: post.gloss,
    picture: post.postPictures.sort((a, b) => b.height - a.height)[0].uri,
    viewCount: post.currentTotalViewCount,
    notes: post.notes
  }

  if (post.gloss) output.gloss = post.gloss
  if (Array.isArray(post.topics)) {
    output.topics = post.topics.map(x => x.topic.friendlyName)
  }

  if (post.phrase) {
    output.title = post.phrase.friendlyPhrase
  }

  return output
}
