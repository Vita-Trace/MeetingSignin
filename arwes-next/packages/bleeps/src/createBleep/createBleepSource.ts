type BleepSource = {
  started: boolean
  stopped: boolean
  start: () => void
  stop: () => void
}

type BleepSourceProps = {
  context: AudioContext
  buffer: AudioBuffer
  gain: GainNode
  loop?: boolean
  onStop?: () => void
}

const createBleepSource = (props: BleepSourceProps): BleepSource => {
  const { context, buffer, gain, loop, onStop } = props

  const source = context.createBufferSource()

  let started = false
  let stopped = false

  source.buffer = buffer
  source.loop = !!loop

  if (loop) {
    source.loopStart = 0
    source.loopEnd = buffer.duration
  }

  const start = (): void => {
    if (!started) {
      source.start()
      started = true
    }
  }

  const stop = (): void => {
    if (!stopped) {
      source.stop()
      source.disconnect(gain)
      stopped = true
      onStop?.()
    }
  }

  source.connect(gain)

  source.onended = () => {
    if (!stopped) {
      onStop?.()
    }
  }

  return {
    get started() {
      return started
    },
    get stopped() {
      return stopped
    },
    start,
    stop
  }
}

export type { BleepSource, BleepSourceProps }
export { createBleepSource }
