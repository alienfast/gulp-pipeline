import Recipes from './recipes'

/**
 *
 * @param recipes - (recipes or task fns, or task names)
 */
const series = (gulp, ...recipes) => {
  let series = gulp.series(new Recipes().toTasks(recipes))

  // hack to attach the recipes for inspection by aggregate
  series.recipes = recipes
  return series
}
series.displayName = `<series>`

export default series
