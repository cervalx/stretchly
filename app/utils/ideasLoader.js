import Shuffled from './shuffled.js'

class IdeasLoader {
  constructor (data) {
    this.data = data
  }

  ideas () {
    const enabled = this.data.filter(item => item.enabled)
    const groups = [
      enabled.filter(item => item.group !== 2),
      enabled.filter(item => item.group === 2)
    ].filter(items => items.length).map(items => new Shuffled(items.map(item => item.data)))

    if (groups.length < 2) return groups[0] || new Shuffled([])

    let nextGroup = 0
    return {
      get randomElement () {
        const idea = groups[nextGroup].randomElement
        nextGroup = 1 - nextGroup
        return idea
      }
    }
  }
}

export default IdeasLoader
