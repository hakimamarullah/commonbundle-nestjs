#!/bin/bash

set -e
set -o pipefail

npm run build
npm publish