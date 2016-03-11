import Recipes from './recipes'

/**
 *
 * @param recipes - (recipes or task fns, or task names)
 */
const parallel = (gulp, ...recipes) => {
   return gulp.parallel(Recipes.toTaskNames(recipes))
}

export default parallel
