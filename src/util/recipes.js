import Base from '../base'

const Recipes = class extends Base {

  constructor(config = {debug: true}) {
    super(config)
  }

  /**
   * Prefer to return the taskFn instead of a string, but return the string if that's all that is given to us.
   *
   * @param recipe
   * @returns {*}
   */
  toTask(recipe) {
    let taskName = null
    if (typeof recipe === "string") {
      // any given task name should be returned as-is
      taskName = recipe
      this.debug(`toTask(): ${taskName}`)
    }
    else {
      if (typeof recipe === "function") {
        // any given fn should be return as-is i.e. series/parallel
        taskName = recipe
      }
      else {
        // any recipe should be converted to string task name
        taskName = recipe.taskFn
      }
      this.debug(`toTask(): ${taskName.name || taskName.displayName}`)
    }
    return taskName
  }

  /**
   * Yield the nearest set of task names - return nested series/parallel fn - do not follow them and flatten them (they will do that themselves if using the helper methods)
   *
   * @param recipes
   * @returns {Array}
   */
  toTasks(recipes, tasks = []) {
    this.debugDump('toTasks: recipes', recipes)

    for (let recipe of recipes) {
      //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
      if (Array.isArray(recipe)) {
        tasks.push(this.toTasks(recipe, []))
      }
      else {
        let taskName = this.toTask(recipe)
        tasks.push(taskName)
      }
    }

    return tasks
  }
}

export default Recipes
