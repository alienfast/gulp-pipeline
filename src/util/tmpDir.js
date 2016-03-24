import tmp from 'tmp'

/**
 *
 */
const tmpDir = (options = {prefix: 'gulp-pipeline_'}) => {
  let tmpDirObj = tmp.dirSync(options)

  tmpDirObj.removeCallback.displayName = '<tmpDir cleanup>'

  return tmpDirObj
}

export default tmpDir
