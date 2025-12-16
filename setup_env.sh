#!/bin/bash
export NVM_DIR="$HOME/.nvm"
# Install nvm if not exists
if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Load nvm
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install node
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Verify
node -v
pnpm -v
