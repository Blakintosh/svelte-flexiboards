# Deploy to Hetzner over SSH

Flexiboards uses the existing Node and Caddy installation on `ssh hetzner`. Run it as a systemd service on `127.0.0.1:3003`. The other apps currently use ports 3000, 3001, and 3002. No Docker installation is needed.

The server has Node 22.22.1 and Caddy 2.11.4. The current deployment runs directly from `/opt/apps/flexiboards/site`. The installed systemd unit uses that working directory and starts `/usr/bin/node build` as the `flexiboards` user. Caddy already redirects the bare domain and proxies the canonical host to port 3003.

## Update the current deployment

From an interactive root shell on Hetzner:

```sh
cd /opt/apps/flexiboards
git status --short
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build:packages && pnpm -C site build
```

Preserve the server's local change to `deploy/flexiboards.service`, which sets the working directory to `/opt/apps/flexiboards/site`. Only restart after the build succeeds:

```sh
systemctl restart flexiboards
node scripts/check-site-server.mjs http://127.0.0.1:3003
node scripts/check-site-server.mjs https://www.flexiboards.dev
```

Building in the live checkout replaces assets while the old process is running. Use the isolated release layout below when moving to deployments that keep the current build intact. The remaining sections describe that optional setup; its `repo`, `releases`, and `current` paths are not used by the current service.

## First-time setup

For a new installation using isolated release directories, connect with `ssh hetzner` and run these commands as root:

```sh
useradd --system --user-group --create-home --home-dir /opt/apps/flexiboards --shell /usr/sbin/nologin flexiboards
install -d -o flexiboards -g flexiboards /opt/apps/flexiboards/releases
runuser -u flexiboards -- git clone https://github.com/Blakintosh/svelte-flexiboards.git /opt/apps/flexiboards/repo
```

Use these account-creation commands only for a new installation. On the existing server, the `flexiboards` account and `/opt/apps/flexiboards` checkout already exist. Prepare the release directories and a separate checkout without replacing the live checkout. Check out the reviewed release commit in `/opt/apps/flexiboards/repo` before building.

Install the repository's pnpm version for this app:

```sh
runuser -u flexiboards -- npm install --prefix /opt/apps/flexiboards/tooling pnpm@11.26.0
```

This leaves the server's Node installation and the other apps' package managers unchanged.

## Pull and build a release

From a root shell on Hetzner:

```sh
cd /opt/apps/flexiboards/repo
runuser -u flexiboards -- git pull --ff-only
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$(runuser -u flexiboards -- git rev-parse --short HEAD)"
release_dir="/opt/apps/flexiboards/releases/$release_id"
runuser -u flexiboards -- env PATH="/opt/apps/flexiboards/tooling/node_modules/.bin:$PATH" \
  node scripts/package-site.mjs "$release_dir"
```

The build needs development dependencies. The exported release contains the production server and its production dependencies, including the workspace packages. A failed build leaves the current release running.

The site's canonical origin is `https://www.flexiboards.dev`. Set `SITE_ORIGIN` before building only if intentionally changing that host. The service's `ORIGIN` must match the public URL.

## Test before switching the service

Start the candidate temporarily on an unused loopback port:

```sh
runuser -u flexiboards -- env HOST=127.0.0.1 PORT=4303 ORIGIN=http://127.0.0.1:4303 \
  node "$release_dir/build" &
candidate_pid=$!
```

Once the server reports that it is listening, run:

```sh
node scripts/check-site-server.mjs http://127.0.0.1:4303
kill "$candidate_pid"
wait "$candidate_pid" || true
```

The check covers server-rendered docs, both framework Markdown exports, registry files, health, sitemap, and robots.txt. Stop the candidate if any check fails; keep the existing `current` link.

## Activate the release

Keep the previous release path before changing the link:

```sh
previous_release="$(readlink -f /opt/apps/flexiboards/current || true)"
ln -s "$release_dir" /opt/apps/flexiboards/current.next
mv -Tf /opt/apps/flexiboards/current.next /opt/apps/flexiboards/current
install -m 0644 deploy/flexiboards.service /etc/systemd/system/flexiboards.service
systemctl daemon-reload
systemctl enable flexiboards
systemctl restart flexiboards
systemctl status flexiboards --no-pager
node scripts/check-site-server.mjs http://127.0.0.1:3003
```

This starts the site on loopback only. The systemd unit runs as the `flexiboards` account, restarts after failures, and allows the Node server to finish requests during shutdown. A restart can cause a brief interruption; this procedure does not provide zero-downtime deployments.

If the restart or smoke check fails and `previous_release` is set:

```sh
ln -s "$previous_release" /opt/apps/flexiboards/current.rollback
mv -Tf /opt/apps/flexiboards/current.rollback /opt/apps/flexiboards/current
systemctl restart flexiboards
node scripts/check-site-server.mjs http://127.0.0.1:3003
```

For a failed first deployment, stop `flexiboards` and inspect `journalctl -u flexiboards -n 100 --no-pager`. Keep at least the current and previous working release directories.

## Connect the public domains

Complete the npm and screen-reader checks in [RELEASING.md](../RELEASING.md) before the public cutover.

Back up `/etc/caddy/Caddyfile`, then append the two site blocks from [Caddyfile](Caddyfile) exactly once. They redirect `flexiboards.dev` to `www.flexiboards.dev` and proxy the canonical host to port 3003. Preserve the existing `gscode.net` sites and global options.

```sh
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Do not reload if validation fails. Update the A/AAAA records for both domains to the Hetzner server when ready to launch. Check both IPv4 and IPv6 records; a stale record can send some visitors to the old host. Caddy obtains and renews HTTPS certificates for the configured domains once they resolve to this server and ports 80/443 are reachable.

Verify the redirect and public site, then run from the development checkout:

```sh
LAUNCH_URL=https://www.flexiboards.dev pnpm -C site e2e:launch
```

Keep the old hosting deployment available until DNS has settled and the public checks pass. Remove its Git auto-deploy integration so a later push cannot publish an outdated site there.
