#!/bin/bash
set -ex

MY_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd $MY_DIR/edge_device
# serve fastapi app
python3 -m uvicorn fastapi_app:app --port 8778