import Recipes from './recipes'

/**
 *
 * @param recipes - (recipes or task fns, or task names)
 */
const parallel = (gulp, ...recipes) => {
   let parallel = gulp.parallel(new Recipes().toTaskNames(recipes))

  // hack to attach the recipes for inspection by aggregate
  parallel.recipes = recipes
  return parallel
}

export default parallel
