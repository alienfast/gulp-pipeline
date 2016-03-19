#!/usr/bin/env bash -l

ENV_RVM=`rvm env --path --ruby-version`
#echo "RVM at $ENV_RVM from `pwd`"
source $ENV_RVM

#echo "Executing: $@ in $PWD"
$@


