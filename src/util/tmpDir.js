import tmp from 'tmp'

/**
 *
 */
const tmpDir = (options = {prefix: 'gulp-pipeline_'}) => {
  let tmpobj = tmp.dirSync(options)
  return tmpobj.name
}

export default tmpDir
