# gulp-pipeline
Meta gulp plugin recipes modularized as ES2015 classes. Fully configurable. Fully extensible. Full pipeline in a few lines of code.

This **is not** just for rails, it's agnostic and works for anything (node, angular, etc).

## Usage
Here's a `gulpfile.babel.js` that provides tasks to build and watch an ES2015/SCSS project.  Simple enough?
 
```javascript
// Assuming project named: acme

import { Presets, Clean, EsLint, Images, ScssLint, Sass, RollupEs, RollupCjs, RollupIife, TaskSeries } from 'gulp-pipeline'
import gulp from 'gulp'

// Utilize one of the common configs
let preset = Presets.rails() // other pre-configured presets: nodeSrc, nodeLib - see presets.js and submit PRs with other common configs

// Instantiate ordered array of recipes (for each instantiation the tasks will be created e.g. sass and sass:watch)
//  Note: these are run by the run-sequence, allowing series and parallel execution
let recipes = [
  new Clean(gulp, preset),
  [
    new EsLint(gulp, preset),
    new ScssLint(gulp, preset)
  ],
  [
    new Images(gulp, preset),
    new Sass(gulp, preset),
    new RollupEs(gulp, preset, {options: {dest: 'dist/acme.es.js'}}),                        // es
    new RollupCjs(gulp, preset, {options: {dest: 'dist/acme.cjs.js'}}),                      // commonjs
    new RollupIife(gulp, preset, {options: {dest: 'dist/acme.iife.js', moduleName: 'acme'}}) // iife self executing bundle for the browser
  ]
]


// Simple helper to create the `default` and `default:watch` tasks as a series of the recipes already defined
new TaskSeries(gulp, 'default', recipes)
```

This configuration generates the following (call the `help` task):

![Help](help-demo.png) 

## Recipes
- Autoprefixer
- EsLint
- Images
- Rollup (variations include amd, cjs, es, iife, umd)
- Sass
- ScssLint
- Clean (subvariations include javascripts, stylesheets, images)

## TaskSeries
TaskSeries allows tasks to be run in a sequence or in a heterogeneous set of sequence/parallel executions (using the implementation from [run-sequence](https://github.com/OverZealous/run-sequence)).  A simple array will run in series, nested arrays will allow those tasks to run in parallel.  In the example above, the following are executed:

    1. clean
    2. eslint && scsslint tasks in parallel
    3. images, sass, && rollup* tasks in parallel
    
Note that unless `watch: false`, any `TaskSeries` instantiation will generate a `watch` variation as well.  For the above `TaskSeries`, both the `default` task as well as the `default:watch` task will be generated.  The watch variation is special in that it will aggregate all watched sources from _any watchable_ task in the series and upon a change, it will execute the full series.    
  
## Help
Generates a `help` task and dynamic help descriptions, making it easier to know the effects and if your config and presets are set properly. 
    

## Why?

### Too many different tools
The javascript community is iterating on asset tooling faster than others, indeed they own many of the tools.  In moving back and forth between node based projects and rails, we found at a minimum we were working with different configurations, and at most we were dealing with completely different or out of date tools.

Why don't we just use the same tools for the asset pipeline?  Now we can.  

### Reuse, modularity, extensibility
We are certainly not the first to consider this.  What we did see is that noone was actually reusing shared code in a way that benefits many.  We have seen people share code in a repository, but only in a way that could be cloned or copied.  We want actual reuse, in that we never want to copy code again. When we transpile ES6, we want check it with EsLint.  When we transpile SCSS, we want to check it with ScssLint...and we never want to copy that code again.  That error handling gotcha?  Don't create a gist, update and share the recipe.

## Who is this for?
**Any project** that wants gulp recipes in a reusable/extensible/modular way (node, rails, angular, etc, etc).  While we certainly want to provide recipes that can be reused and replace the conveniences of a full rails pipeline, these recipes are modular enough that any project (node, angular, etc) can utilize them.

## Error handling
Error handling is baked into the recipes and the `Base.notifyError()` sends messages to you through [`gulp-notify`](https://github.com/mikaelbr/gulp-notify) with some nice console colors, a beep, and an OS notification (if possible).

## How it works

### Recipes
Each recipe is an ES2015 class having configurable options that registers a task as well as a watch task if applicable.  These are simply common gulp build configurations.

### Common config
Each recipe depends on a common configuration for the `source` and `watch` that can be fed directly to `gulp.src`, this is the `node-glob` format with options.  Even when interfacing with other libraries that don't use `gulp.src` directly (such as rollup), these recipes use a common config for ease of use and to enable generic preset definitions.

### Presets definitions
Common preset definitions are maintained in [presets.js](src/presets.js).  These are simply common configurations for different structures found in common stacks such as node, rails, etc.  Recipes will fallback on these for configurations such as the `node-glob` `cwd`.  One example would be the `cwd` for all javascript.

### Merged configurations
Each recipe's ultimate configuration is merged with your overrides - this provides a great deal of flexibility since any configuration you provide will override the defaults.  This is all provided via the [`node-extend`](https://github.com/justmoon/node-extend#usage) library.  Familiarity with how this works should allow you to specify just about anything.

## Debugging
Initialize any recipe with `{debug: true}` and additional information can be found in the log.
                                                                                     
## I want it to work different...what can I do?

There are many things you can do here (not an exhaustive list):

1. Configure the options which are passed into the recipe that is instantiated.

1. Extend the class and customize it to your liking

1. Extend the `BaseRecipe` class to create your own recipe

1. Create your own gulp task and simpy `#run` the recipe without registering tasks:
  ```javascript
  gulp.task('foo', () => {
    // do stuff
  
    // run the recipe
    new Sass(gulp, {task: false, watch: false}).run()
    
    // do other stuff
  })
  ```
1. Submit a PR to change the existing recipe to a better one!


## You don't have a recipe that does ______
Submit a PR and we'll include it!


## Credits
> If I have seen further, it is by standing on the shoulders of giants. - Sir Isaac Newton
  
- VigetLabs for their blog post _[Gulp on Rails: Replacing the Asset Pipeline](https://viget.com/extend/gulp-rails-asset-pipeline)_ and [gulp-rails-pipeline starter project](https://github.com/vigetlabs/gulp-rails-pipeline)
- Argency for their blog post _[Gulp - a modern approach to asset pipeline for Rails developers](http://blog.arkency.com/2015/03/gulp-modern-approach-to-asset-pipeline-for-rails-developers/)_ 
