import tmpDirObj from './tmpDir'

/**
 *
 */
const tmpDirName = (options = {prefix: 'gulp-pipeline_'}) => {
  return tmpDirObj(options).name
}

export default tmpDirName
