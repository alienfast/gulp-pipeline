# gulp-pipeline
Meta gulp plugin recipes modularized as ES6 classes. Fully configurable. Fully extensible. Full pipeline in a few lines of code.

ES6, reusable, modular, extensible gulp recipes.

## Why?

### Too many different tools
The javascript community is iterating on asset tooling faster than others, indeed they own many of the tools.  In moving back and forth between node based projects and rails, we found at a minimum we were working with different configurations, and at most we were dealing with completely different or out of date tools.

Why don't we just use the same tools for the asset pipeline?  Now we can.  

### Reuse, modularity, extensibility
We are certainly not the first to consider this.  What we did see is that noone was actually reusing shared code in a way that benefits many.  We have seen people share code in a repository, but only in a way that could be cloned or copied.  We want actual reuse, in that we never want to copy code again. When we transpile ES6, we want check it with EsLint.  When we transpile SCSS, we want to check it with ScssLint.

## Who is this for?
Anyone that wants gulp recipes in a reusable/extensible/modular way.  While we certainly want to provide recipes that can be reused and replace the rails pipeline, these recipes should be modular enough that any project (node, bower, angular) can utilize them.

## Usage
NOTE: very much a work in progress

Here's an ES6 authored `gulpfile.babel.js` that provides tasks to build and watch an ES6/SCSS project.  Simple enough?
 
```javascript
import { Scss, Browserify } from 'gulp-pipeline'
import gulp from 'gulp'

let scss = new Scss(gulp)
let browserify = new Browserify(gulp)

// add macro default task
gulp.task('default', [scss.taskName(), browserify.taskName()])

// add macro watch task
gulp.task('watch', [scss.watchTaskName(), browserify.watchTaskName()])
```

Run it with `gulp`.

## How it works
Each exported ES6 class is a recipe having configurable options that registers a task as well as a watch task if applicable.  These are simply common gulp build configurations.

## I want it to work different

Certainly!  There are a number of ways to accomplish this.
1.  Configure the options which are passed into the recipe that is instantiated.
2.  Extend an existing recipe with customizations
3.  Submit a PR!

## You don't have x
Submit a PR and we'll include it!