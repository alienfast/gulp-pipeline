import BaseRecipe from './baseRecipe'
import extend from 'extend'
import fs from 'fs-extra'
import path from 'path'
import process from 'process'
import pathIsAbsolute from 'path-is-absolute'
import glob from 'glob'


/**
 *  This recipe will keep your source branch clean but allow you to easily push your
 *  dist files to a separate branch, all while keeping track of the origin commits.
 *
 *  Did I mention it will autotag based on your package.json?
 *
 *  Typically, your build tools put compiled files in dist.  A clean build packages typically needs to consist of
 *  1. package metadata - package.json or bower.json
 *  2. license
 *  3. compiled dist files
 *  4. source files - Javascript ES projects, as well as SCSS libraries for example need to publish source
 *
 *  To keep your source branch clean with this recipe's default configuration, add the following to .gitignore:
 *  - build
 *  - dist
 *
 *  Run this recipe, it will delete/create the `build` dir, copy the files above, and commit/push (changes from remote)
 *  to the `dist` branch.  Now you have clean separation of source and dist.
 *
 *  Have long running maintenance on an old version?  Publish to a different dist branch like { options: {branch: 'dist-v3'} }
 */
const Default = {

  dir: 'build', // directory to assemble the files - make sure to add this to your .gitignore so you don't publish this to your source branch
  source: {
    types: ['javascripts', 'stylesheets'], // source types to resolve from preset and copy into the build directory pushing to the dist branch
    files: ['package.json', 'bower.json', 'LICENSE*', 'dist'] // any additional file patterns to copy to `dir`
  },

  watch: false,
  presetType: 'macro',
  task: {
    name: 'buildControl',
    help: 'Assembles and pushes the build to a branch'
  },
  options: { // see https://github.com/alienfast/build-control/blob/master/src/buildControl.js#L11
    //cwd: 'build', // Uses recipe's dir
    branch: 'dist'
  }
}

const BuildControl = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))

    // use the dir as the cwd to the BuildControl class
    this.config.options = extend(true, {cwd: this.config.dir}, this.config.options)
  }

  /**
   * Copy all the configured sources to the config.dir directory
   */
  prepareBuild() {
    let buildDir = this.config.dir
    this.debug(`Using build directory: ${buildDir}`)

    // first remove the dest folder and reestablish one
    fs.removeSync(buildDir)
    fs.ensureDirSync(buildDir)

    // copy preset type files
    for (let type of this.config.source.types) {
      let typePreset = this.preset[type]

      for (let name of glob.sync(typePreset.source.all, typePreset.source.options)) {
        let from = path.join(typePreset.source.options.cwd, name)
        let to = path.join(buildDir, from)
        this.debug(`copying ${from} to ${to}...`)
        fs.copySync(from, to)
      }
    }

    // copy any additional configured files
    for (let fileGlob of this.config.source.files) {

      for (let fromFullPath of glob.sync(fileGlob, {realpath: true})) {
        let from = path.relative(process.cwd(), fromFullPath)
        let to = path.join(buildDir, from)
        this.debug(`copying ${from} to ${to}...`)
        fs.copySync(from, to)
      }
    }
  }

  run() {
    this.prepareBuild()

    // TODO: finally run build control
  }

  resolvePath(cwd, base = process.cwd()) {
    if (!pathIsAbsolute(cwd)) {
      return path.join(base, cwd)
    }
    else {
      return cwd
    }
  }
}

export default BuildControl
