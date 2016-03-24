import BasePublish from './basePublish'
import {BuildControl} from 'build-control'


/**
 *  This recipe will keep your source branch clean but allow you to easily push your
 *  _gh_pages files to the gh-pages branch.
 */
const Default = {
  //debug: true,
  task: {
    name: 'publish:gh-pages',
    description: 'Publishes a _gh_pages directory to gh-pages branch'
  },
  options: {
    cwd: '_gh_pages',
    branch: 'gh-pages',
    tag: false, // no tagging on gh-pages push
    clean: { // no cleaning of cwd, it is built externally
      before: false,
      after: true  // we create a git repo, and without cleaning, subsequent runs will fail with "uncommitted changes"
    }
  }
}

const PublishGhPages = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
  }

  run(done) {
    let buildControl = new BuildControl(this.config.options)

    // run the commit/tagging/pushing
    buildControl.run()

    done()
  }
}

export default PublishGhPages
