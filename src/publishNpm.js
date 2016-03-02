import BasePublish from './basePublish'
import Npm from 'build-control/src/npm'
import extend from 'extend'

const Default = {
  task: {
    name: 'publishNpm',
    help: 'Publishes package on npm'
  },
  options: {}
}

/**
 *  This recipe will run execute `npm publish` with no other checks.
 *
 *  @see also PublishBuild - it will bump, publish build, and publish npm (all in one)
 */
const PublishNpm = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
  }

  run() {
    let npm = new Npm(this.config.options)
    npm.publish()
  }
}

export default PublishNpm
