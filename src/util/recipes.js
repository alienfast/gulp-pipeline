import Base from '../base'

const RecipesImplementation = class extends Base {

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

const Recipes = class {
  static toTaskNames(recipes, tasks = []){
    return instance.toTaskNames(recipes, tasks)
  }

  static toTaskName(recipe){
    return instance.toTaskName(recipe)
  }
}

//  singleton
let instance = new RecipesImplementation()

export default Recipes
