
export class PeerFetch {

  public message = "Default class attribute Hi!"

  constructor(message: string = 'Default Constructor Hi!') {
    this.message = message
    console.debug('!!!!>>>>>>' + this.message + '<<<<<<!!!!!')
  }

  greet(): string {
    console.debug('>>>>>>' + this.message + '<<<<<<')
    return this.message
  }

  meet() {
    return 123
  }
}
