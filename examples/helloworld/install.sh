#!/bin/bash
set -ex 

MY_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

#[Prepare edge device code]

cd $MY_DIR/edge_device
# install python dependencies for this example app
python3 -m pip install -r requirements.txt

# install local peerfetch python package
cd $MY_DIR/../../python
python3 -m pip install -e ./src

#[Prepare browser code]
# install local peerfetch javascript package
cd $MY_DIR/../../javascript
npm run build
