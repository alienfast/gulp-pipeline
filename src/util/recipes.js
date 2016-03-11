import Base from '../base'

const Recipes = class extends Base {

  constructor(config = {debug: true}) {
    super(config)
  }

  toTaskName(recipe) {
    let taskName = null
    if (typeof recipe === "string") {
      taskName = recipe
    }
    else if (typeof recipe === "function") {
      taskName = recipe
    }
    else {
      taskName = recipe.taskName()
    }
    return taskName
  }

  toTaskNames(recipes, tasks = []) {

    console.log('*****************************************')
    this.debug(`toTaskNames: typeof ${typeof recipes}`)
    this.debugDump('recipes', recipes)

    //this.debugDump(`toTaskNames`, recipes)
    for (let recipe of recipes) {
      //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
      if (Array.isArray(recipe)) {
        tasks.push(this.toTaskNames(recipe, []))
      }
      else {
        let taskName = this.toTaskName(recipe)
        this.debug(`Adding to list ${taskName}`)
        tasks.push(taskName)
      }
    }

    return tasks
  }
}

export default Recipes
