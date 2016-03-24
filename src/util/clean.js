import BaseClean from '../baseClean'

/**
 * Simplified clean() that uses the BaseClean recipe
 */
const clean = (gulp, name, options = {}) => {
  let c = new BaseClean(gulp, {}, {dest: name, options: {force: true}}, options)
  // set the display name so it shows up in the task list
  c.taskFn.displayName = `<clean>`
  return c
}

export default clean
