#!/bin/bash

set -euo pipefail

# Install maven 3.9 (ubuntu has older versions only)
MAVEN_VERSION="3.9.8"

wget -qO- "https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz" | tar -xz -C $HOME/.local/share

ln -s $HOME/.local/share/apache-maven-${MAVEN_VERSION}/bin/mvn $HOME/.local/bin/mvn
ln -s $HOME/.local/share/apache-maven-${MAVEN_VERSION}/bin/mvnDebug $HOME/.local/bin/mvnDebug

# Install nvm and nodes
export NVM_DIR="${HOME}/.nvm"
if [ ! -f "${NVM_DIR}/nvm.sh" ]; then
  nvm_version="$(curl -fsSL https://api.github.com/repos/nvm-sh/nvm/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')"
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${nvm_version}/install.sh" | PROFILE="${BASH_ENV}" bash
fi
# shellcheck source=/dev/null
. "${NVM_DIR}/nvm.sh"
nvm install 22
nvm use 22

# install yarn

npm install -g yarn

# avoiding interactive prompts (e.g. when installing tzdata)
export DEBIAN_FRONTEND=noninteractive

# agent browser & playwright
npm install -g agent-browser
export PLAYWRIGHT_BROWSERS_PATH=~/.local/share/browsers
npx playwright install --with-deps chromium

ln -sf $(find ${PLAYWRIGHT_BROWSERS_PATH} -type f \( -name "headless_shell" -o -name "chrome-headless-shell" \) 2>/dev/null | head -1) ~/.local/bin/chromium

cat << 'EOF' > "${HOME}/.local/bin/agent-browser"
#!/bin/bash
NODE_VERSION=$(ls -1 "$HOME/.nvm/versions/node" | grep -E '^v24\.' | sort -V | tail -n 1)

if [ -z "$NODE_VERSION" ]; then
  echo "Error: No Node v24.x.x found in $HOME/.nvm/versions/node"
  exit 1
fi

AB_BIN="$HOME/.nvm/versions/node/$NODE_VERSION/bin/agent-browser"

exec "$AB_BIN" "$@"
EOF
chmod +x "${HOME}/.local/bin/agent-browser"

# rtk
# Note: enable if needed, but beware of the security implications
echo "➡️ Installing rtk..."
curl -fsSL https://raw.githubusercontent.com/novoj/rtk/refs/heads/master/install.sh | sh

export PATH="$HOME/.local/bin:$PATH"

if ! command -v rtk >/dev/null 2>&1; then
  echo "ERROR: rtk was installed but is still not in PATH" >&2
  exit 1
fi

echo "➡️ Initializing rtk..."
rtk init -g
