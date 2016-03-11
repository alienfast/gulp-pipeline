import Recipes from './recipes'

/**
 *
 * @param recipes - (recipes or task fns, or task names)
 */
const series = (gulp, ...recipes) => {
   return gulp.series(Recipes.toTaskNames(recipes))
}

export default series
