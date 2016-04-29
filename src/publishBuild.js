import BasePublish from './basePublish'
import {BuildControl} from 'build-control'
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
 *
 *  Travis-CI note: add the following:
 *
 *   # remove the dist branch and dist tags from travis builds
 *   branches:
 *    except:
 *       - dist
 *       - /^v(\d+\.)?(\d+\.)?(\*|\d+)$/
 *
 */
const Default = {
  //debug: true,
  npm: {
    bump: true,
    publish: true
  },
  readme: {
    enabled: true,
    name: 'README.md',
    template: `# %sourceName%

%sourceTagLink% built from commit %sourceCommitLink% on branch \`%sourceBranch%\`. See the [README](../..) for more details

---
<sup>Built and published by [gulp-pipeline](https://github.com/alienfast/gulp-pipeline) using [build-control](https://github.com/alienfast/build-control)</sup>
`
  },
  task: {
    name: 'publish:build',
    description: 'Assembles and pushes the build to a branch'
  }
}

const PublishBuild = class extends BasePublish {

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

    // bump the version and commit to git
    if(this.config.npm.bump) {
      buildControl.npm.bump()
    }

    this.prepareBuildFiles()

    this.generateReadme(buildControl)

    // run the commit/tagging/pushing
    buildControl.run()

    // publish to npm
    if(this.config.npm.publish) {
      buildControl.npm.publish()
    }

    done()
  }

  generateReadme(buildControl) {
    // generate a readme on the branch if one is not copied in.
    if (this.config.readme.enabled) {
      let readme = path.join(this.config.dir, this.config.readme.name)
      if (fs.existsSync(readme)) {
        this.log(`Found readme at ${readme}.  Will not generate a new one from the template.  Turn this message off with { readme: {enabled: false} }`)
      }
      else {
        fs.writeFileSync(readme, buildControl.interpolate(this.config.readme.template))
      }
    }
  }

  /**
   * Copy all the configured sources to the config.dir directory
   */
  prepareBuildFiles() {
    let buildDir = this.config.dir
    this.debug(`Using build directory: ${buildDir}`)

    // copy preset type files
    for (let type of this.config.source.types) {  // defaulted in BasePublish
      let typePreset = this.preset[type]

      this.log(`Copying ${typePreset.source.options.cwd}/${typePreset.source.all}...`)
      for (let name of glob.sync(typePreset.source.all, typePreset.source.options)) {
        let from = path.join(typePreset.source.options.cwd, name)
        let to = path.join(buildDir, from)
        this.log(`\t...to ${to}`)
        fs.copySync(from, to)
      }
    }

    // copy any additional configured files
    for (let fileGlob of this.config.source.files) { // defaulted in BasePublish

      this.log(`Copying ${fileGlob}...`)
      for (let fromFullPath of glob.sync(fileGlob, {realpath: true})) {
        let from = path.relative(process.cwd(), fromFullPath)
        let to = path.join(buildDir, from)
        this.log(`\t...to ${to}`)
        fs.copySync(from, to)
      }
    }
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

export default PublishBuild
