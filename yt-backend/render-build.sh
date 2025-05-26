#!/usr/bin/env bash
set -euo pipefail

# Install required system packages
apt-get update && apt-get install -y ffmpeg

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt