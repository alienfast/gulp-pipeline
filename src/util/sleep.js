import Sleep from '../sleep'

/**
 * Simplified sleep() that uses the Sleep recipe
 */
const sleep = (gulp, ms) => {
  let c = new Sleep(gulp, {}, ms)
  // set the display name so it shows up in the task list
  c.taskFn.displayName = `<sleep>`
  return c
}

export default sleep
