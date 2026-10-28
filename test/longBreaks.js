import assert from 'node:assert/strict'
import BreaksPlanner from '../app/breaksPlanner.js'

describe('Long breaks', () => {
  let planner
  let values
  let now
  const realNow = Date.now

  beforeEach(() => {
    now = 100000000
    Date.now = () => now
    values = {
      microbreak: true,
      break: true,
      microbreakInterval: 600000,
      microbreakDuration: 60000,
      breakInterval: 2,
      breakDuration: 300000,
      breakNotification: true,
      breakNotificationInterval: 30000,
      microbreakNotification: true,
      microbreakNotificationInterval: 10000,
      breakPostponeTime: 300000,
      longBreak: true,
      longBreakDuration: 3600000,
      longBreakInterval: 10800000,
      naturalBreaks: false,
      monitorDnd: false,
      appExclusions: []
    }
    planner = new BreaksPlanner({ get: key => values[key] })
  })

  afterEach(() => {
    if (planner.scheduler) planner.scheduler.cancel()
    planner.naturalBreaksManager.stop()
    planner.dndManager.stop()
    planner.appExclusionsManager.stop()
    Date.now = realNow
  })

  it('preserves the Mini, Mini, Regular schedule before the Long break is due', () => {
    for (const reference of ['startMicrobreakNotification', 'startMicrobreakNotification', 'startBreakNotification']) {
      planner.nextBreak()
      assert.equal(planner.scheduler.reference, reference)
      assert.equal(planner.isLongBreak, false)
      assert.equal(planner.timeToNextBreak, 600000)
    }
  })

  it('schedules a Long break at three hours with its own one-hour duration', () => {
    planner.nextBreak()
    now += 10500000
    planner.nextBreak()
    assert.equal(planner.isLongBreak, true)
    assert.equal(planner.scheduler.reference, 'startBreakNotification')
    assert.equal(planner.scheduler.delay, 270000)
    assert.equal(planner.timeToNextBreak, 300000)
    now += planner.scheduler.delay
    planner.nextBreakAfterNotification()
    assert.equal(planner.scheduler.delay, 30000)
    now += planner.scheduler.delay
    planner.scheduler.cancel()
    planner.emit('breakStarted', false)
    assert.equal(planner.scheduler.reference, 'finishBreak')
    assert.equal(planner.scheduler.delay, 3600000)
  })

  it('resumes normal breaks and starts a new three-hour interval after a Long break', () => {
    planner.nextBreak()
    planner.skipToBreak(undefined, true)
    now += 3600000
    planner.nextBreak()
    assert.equal(planner.isLongBreak, false)
    assert.equal(planner.nextLongBreakAt, now + 10800000)
    assert.equal(planner.breakDuration, 300000)
  })

  it('starts an overdue Long break immediately', () => {
    now += 10800001
    planner.nextBreak()
    assert.equal(planner.isLongBreak, true)
    assert.equal(planner.scheduler.reference, 'startBreak')
    assert.equal(planner.scheduler.delay, 0)
  })

  it('shortens the notification instead of delaying a Long break', () => {
    now += 10790000
    planner.nextBreak()
    assert.equal(planner.scheduler.delay, 0)
    assert.equal(planner.timeToNextBreak, 10000)
    planner.nextBreakAfterNotification()
    assert.equal(planner.scheduler.delay, 10000)
  })

  it('keeps the Long break type and the full delay when postponed', () => {
    planner.nextBreak()
    planner.skipToBreak(undefined, true)
    planner.postponeCurrentBreak()
    assert.equal(planner.isLongBreak, true)
    assert.equal(planner.scheduler.delay, 270000)
    now += 270000
    planner.nextBreakAfterNotification()
    assert.equal(planner.scheduler.delay, 30000)
    assert.equal(planner.breakDuration, 3600000)
  })

  it('can run Long breaks when Mini and Regular breaks are disabled', () => {
    values.microbreak = false
    values.break = false
    planner.nextBreak()
    assert.equal(planner.isLongBreak, true)
    assert.equal(planner.timeToNextBreak, 10800000)
  })

  it('can disable Long breaks without changing the existing schedule', () => {
    values.longBreak = false
    now += 10800001
    planner.nextBreak()
    assert.equal(planner.isLongBreak, false)
    assert.equal(planner.scheduler.reference, 'startMicrobreakNotification')
  })

  it('can jump to Mini or Regular breaks after selecting a Long break', () => {
    planner.nextBreak()
    planner.skipToBreak(undefined, true)
    planner.skipToMicrobreak()
    assert.equal(planner.isLongBreak, false)
    planner.skipToBreak(undefined, true)
    planner.skipToBreak()
    assert.equal(planner.isLongBreak, false)
    assert.equal(planner.breakDuration, 300000)
  })

  it('keeps Regular and Long strict mode independent', () => {
    for (const regular of [false, true]) {
      for (const long of [false, true]) {
        values.breakStrictMode = regular
        values.longBreakStrictMode = long
        planner.isLongBreak = false
        assert.equal(planner.breakStrictMode, regular)
        planner.isLongBreak = true
        assert.equal(planner.breakStrictMode, long)
      }
    }
  })

  it('restarts the three-hour timer when the schedule is reset', () => {
    planner.nextBreak()
    now += 9000000
    planner.reset()
    assert.equal(planner.isLongBreak, false)
    assert.equal(planner.nextLongBreakAt, now + 10800000)
  })
})
