#!/usr/bin/env bash
# Opt-in host provisioning, separate from npm setup and from application startup.
set -euo pipefail
if [[ "${TTWAR_INSTALL_DOCKER:-}" != "1" ]]; then
  printf '%s\n' 'No changes made. Review executor/README.md before enabling TTWAR_INSTALL_DOCKER=1.'
  exit 2
fi
if [[ "$(id -u)" != "0" ]]; then printf '%s\n' 'Run as root inside the intended Ubuntu WSL distribution.' >&2; exit 1; fi
. /etc/os-release
if [[ "${ID:-}" != "ubuntu" ]]; then printf '%s\n' 'This installer supports Ubuntu only.' >&2; exit 1; fi
case "${VERSION_CODENAME:-}" in jammy|noble|resolute|stonking) ;; *) printf '%s\n' 'Unsupported Ubuntu release; review Docker documentation.' >&2; exit 1;; esac
if [[ "$(dpkg --print-architecture)" != "amd64" ]]; then printf '%s\n' 'The reviewed Piston image requires an amd64 Linux host.' >&2; exit 1; fi
if command -v docker >/dev/null; then printf '%s\n' 'Docker already exists; preserved without upgrades or changes.'; exit 0; fi
for package in docker.io docker-compose docker-compose-v2 podman-docker containerd runc; do
  if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q 'install ok installed'; then
    printf 'Existing package %s requires manual review; nothing removed.\n' "$package" >&2; exit 1
  fi
done
key=/etc/apt/keyrings/ttwar-docker.asc
repo=/etc/apt/sources.list.d/ttwar-docker.sources
if [[ -e "$key" || -e "$repo" ]]; then printf '%s\n' 'Existing TTWar Docker repository files require review; preserved.' >&2; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl
install -d -m 0755 /etc/apt/keyrings
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 https://download.docker.com/linux/ubuntu/gpg -o "$key"
chmod 0644 "$key"
printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: %s\nComponents: stable\nArchitectures: amd64\nSigned-By: %s\n' "$VERSION_CODENAME" "$key" > "$repo"
apt-get update
apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
if [[ "$(ps -p 1 -o comm=)" == "systemd" ]]; then systemctl start docker; else service docker start; fi
docker info --format 'Docker {{.ServerVersion}}, cgroup {{.CgroupVersion}}'
# No docker-group grants, firewall changes, Windows feature changes or containers.
