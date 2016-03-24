#!/bin/bash -l

ENV_RVM=`rvm env --path --ruby-version`
#echo "RVM at $ENV_RVM from `pwd`"
source $ENV_RVM

rails runner $1


