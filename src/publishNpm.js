import BasePublish from './basePublish'
import {Npm} from 'build-control'

const Default = {
  task: {
    name: 'publish:npm',
    description: 'Publishes package on npm'
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
    super(gulp, preset, Default, ...configs)
  }

  run(done) {
    let npm = new Npm(this.config.options)
    npm.publish()
    this.donezo(done)
  }
}

export default PublishNpm
