# Railway 已提供临时站点供维护者验证

迁移状态（2026-11-01）：Railway 已部署网站；正式域名仍指向 Netlify。
维护者目前只使用临时域名，不切换正式域名。

- [临时网站](https://web-production-3338d0.up.railway.app/)
- [Railway 服务](https://railway.com/project/c1433a12-9266-4a45-9afe-f21bfc77c07e/service/6a914228-408f-4af1-a3e4-ccca2183fe28)
- [Netlify 部署](https://app.netlify.com/projects/zgzg-io/deploys)
- [部署配置 PR #302](https://github.com/zgzgorg/zgzg.io/pull/302)

## Docker 构建生成网站并启动 Caddy

`Dockerfile` 用 Ruby 3.3 和 Jekyll 构建网站。最终镜像只运行 Caddy。
`Caddyfile` 监听 `PORT`（默认 8080），提供静态资源和自定义 404 页面。
Caddy 将 `www.zgzg.io` 的请求以 301 跳转到 `https://zgzg.io`，保留路径和查询参数。

`.dockerignore` 只允许网站源文件进入镜像构建。
`.railwayignore` 排除本地设计稿、缓存和环境变量文件。
Railway 的 GitHub 自动部署跟踪 `codex/railway-deploy` 分支。
维护者推送该分支后，Railway 自动构建并更新临时网站。
维护者合并部署 PR 后，需要在 Railway 服务设置中将部署分支改为 `main`。
维护者也可使用 CLI 上传更新：

```sh
railway up --project c1433a12-9266-4a45-9afe-f21bfc77c07e --environment production --service web
```

Railway 自动识别 `Dockerfile`。服务设置使用健康检查 `/`，超时 120 秒。
服务失败时最多重启 3 次。Netlify 继续按原有设置跟踪 `main`。

## 维护者应先验证临时站点再切换 DNS

部署检查覆盖 41 个路径和 135 项静态资源，检查均通过。
检查覆盖中英文首页、活动页面、目录跳转和缺失路径的 404 状态。
浏览器检查确认开票通知弹层可以打开，旧英文地址跳转到 `/en/`。
开票通知接口仍为空；网站尚不能保存开票订阅。

权威 DNS 区域是 `zgzg.io`。
权威服务器是 `demi.ns.cloudflare.com` 和 `jim.ns.cloudflare.com`。
Railway 已创建以下域名绑定，但证书仍在等待 DNS 切换：

| 主机名 | 类型 | Railway 目标 | 当前值 |
| --- | --- | --- | --- |
| `@` | CNAME | `4wldarhf.up.railway.app` | A `75.2.60.5` |
| `www` | CNAME | `lvxf794o.up.railway.app` | CNAME `elastic-gates-3455af.netlify.app` |

维护者应先保存 Cloudflare 中原有记录的完整设置。
维护者只更改根域名和 `www`，保留邮件、其他子域名和域名服务器设置。
Cloudflare 根域名需要 CNAME flattening；同名 A/AAAA 记录不能与 CNAME 并存。
维护者应按 Railway 当时显示的验证要求补充记录，并等待域名验证和证书签发。
维护者需要确认权威解析、递归解析、HTTPS 和 `www` 跳转后，才能完成迁移。

## 维护者可以恢复 Netlify 的 DNS 指向

Netlify 保留现有网站和部署。维护者可恢复上表中的原有值来回退。
维护者还应恢复切换前保存的 TTL 和代理设置，再检查 HTTPS。
维护者不应删除 Netlify 网站或解除 Netlify 的正式域名绑定。
