#!/bin/bash

MY_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd $MY_DIR/edge_device
# start peerjs HTTP proxy
python3 -m peerfetch.proxy