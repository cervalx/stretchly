import assert from 'node:assert/strict'
import IdeasLoader from '../app/utils/ideasLoader.js'
import Shuffled from '../app/utils/shuffled.js'

describe('ideasLoader', function () {
  const ideas = new IdeasLoader([
    { data: 'a', enabled: true },
    { data: 'b', enabled: false },
    { data: 'c', enabled: true }
  ])

  it('returns enabled ideas', () => {
    const enabled = new Shuffled(['a', 'c'])
    assert.deepEqual(ideas.ideas(), enabled)
  })

  it('alternates unequal groups and shuffles each group without repetition', () => {
    const ideas = new IdeasLoader([
      { data: 'a', enabled: true },
      { data: 'b', enabled: true, group: 1 },
      { data: 'c', enabled: true, group: 2 },
      { data: 'disabled', enabled: false, group: 2 }
    ]).ideas()

    for (let cycle = 0; cycle < 10; cycle++) {
      const first = ideas.randomElement
      assert.equal(ideas.randomElement, 'c')
      const second = ideas.randomElement
      assert.equal(ideas.randomElement, 'c')
      assert.deepEqual(new Set([first, second]), new Set(['a', 'b']))
    }
  })

  it('uses the remaining group when the other group has no enabled ideas', () => {
    for (const group of [1, 2]) {
      const ideas = new IdeasLoader([
        { data: 'enabled', enabled: true, group },
        { data: 'disabled', enabled: false, group: 3 - group }
      ]).ideas()

      assert.equal(ideas.randomElement, 'enabled')
      assert.equal(ideas.randomElement, 'enabled')
    }
  })

  it('preserves the empty-list behavior', () => {
    assert.deepEqual(new IdeasLoader([]).ideas(), new Shuffled([]))
  })

  it('preserves long-break title and text arrays', () => {
    const first = ['First title', 'First text']
    const second = ['Second title', 'Second text']
    const ideas = new IdeasLoader([
      { data: first, enabled: true, group: 1 },
      { data: second, enabled: true, group: 2 }
    ]).ideas()

    assert.equal(ideas.randomElement, first)
    assert.equal(ideas.randomElement, second)
  })

  it('keeps separate message lists independent', () => {
    const loader = new IdeasLoader([
      { data: 'a', enabled: true, group: 1 },
      { data: 'b', enabled: true, group: 2 }
    ])
    const mini = loader.ideas()
    const long = loader.ideas()

    assert.equal(mini.randomElement, 'a')
    assert.equal(long.randomElement, 'a')
    assert.equal(mini.randomElement, 'b')
  })
})
