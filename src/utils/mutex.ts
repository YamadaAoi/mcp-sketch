export class Mutex {
  #locked: boolean = false
  #queue: Array<() => void> = []

  async acquire(): Promise<void> {
    if (!this.#locked) {
      this.#locked = true
      return
    }

    return new Promise<void>(resolve => {
      this.#queue.push(resolve)
    })
  }

  release(): void {
    if (this.#queue.length > 0) {
      const next = this.#queue.shift()
      next?.()
    } else {
      this.#locked = false
    }
  }

  async runExclusive<T>(callback: () => T | Promise<T>): Promise<T> {
    await this.acquire()
    try {
      const result = callback()
      return await Promise.resolve(result)
    } finally {
      this.release()
    }
  }
}
