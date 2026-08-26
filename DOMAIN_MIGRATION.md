# ANOMANCER V13.14 · DOMAIN MIGRATION

Canonical public origin is now `https://anomancer.com`.

This release consolidates the previously separate 13.11, 13.12 and 13.13 layers into one full source tree and restores the seven Finnish Dispatches that were visible before the accidental old-source deployment.

## Public truth

- Home: `https://anomancer.com/`
- FI library: `https://anomancer.com/lahetykset`
- EN library: `https://anomancer.com/dispatches`
- Sitemap: `https://anomancer.com/sitemap.xml`
- RSS FI: `https://anomancer.com/rss.xml`
- RSS EN: `https://anomancer.com/rss-en.xml`
- Admin: `https://anomancer.com/admin`

Canonical, Open Graph, hreflang, JSON-LD, sitemap, RSS, manifest and robots all use `anomancer.com`.

## Old vercel.app address

After the production deployment is verified, configure the project domain `anomancer.vercel.app` in Vercel to redirect permanently to `anomancer.com` if the dashboard allows redirect configuration for that project domain. Use 308/301. Until then the old hostname may remain reachable, but its pages declare `anomancer.com` as canonical.

## Search engines

After production:

1. Add/verify `anomancer.com` in Google Search Console.
2. Submit `https://anomancer.com/sitemap.xml`.
3. Keep the old hostname redirecting to the new canonical origin.

Do not deploy older release folders after this release. GitHub `content/` is the content truth and this full source tree is the deployment base.

## Safe install into the current Git/Vercel working copy

From the extracted V13.14 folder:

```bash
./INSTALL_TO_CURRENT.sh
```

The installer uses `rsync --delete` but explicitly preserves `.git/`, `.vercel/`, `node_modules/` and local secret `.env*` files. It then runs build + checks.

If the target is a Git repository, publish the migration to the source-of-truth repository:

```bash
git status
git add -A
git commit -m "ANOMANCER 13.14 domain migration"
git push origin master
```

That Git push should be the production path. Avoid deploying an older local release folder afterwards.
