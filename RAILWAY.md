# Railway 已提供正式网站和临时站点

迁移状态（2026-11-01）：正式域名已指向 Railway，HTTPS 已通过验证。
Netlify 项目已暂时停用，项目配置和部署历史仍然保留。

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
Railway 已连接 `codex/railway-deploy` 分支，并成功构建 GitHub 来源的提交。
GitHub 自动部署仍等待组织授权 Railway App；当前推送不会自动部署。
授权页面仅选择 `zgzgorg/zgzg.io`，维护者需要确认 App 权限。
授权完成后，维护者仍需验证分支推送可以自动更新临时网站。
维护者合并部署 PR 后，需要在 Railway 服务设置中将部署分支改为 `main`。
维护者也可使用 CLI 上传更新：

```sh
railway up --project c1433a12-9266-4a45-9afe-f21bfc77c07e --environment production --service web
```

Railway 自动识别 `Dockerfile`。服务设置使用健康检查 `/`，超时 120 秒。
服务失败时最多重启 3 次。Netlify 项目目前已停用。

## 正式域名已经通过 DNS 和 HTTPS 验证

部署检查覆盖 41 个路径和 135 项静态资源，检查均通过。
检查覆盖中英文首页、活动页面、目录跳转和缺失路径的 404 状态。
浏览器检查确认开票通知弹层可以打开，旧英文地址跳转到 `/en/`。
开票通知接口仍为空；网站尚不能保存开票订阅。

权威 DNS 区域是 `zgzg.io`。
权威服务器是 `demi.ns.cloudflare.com` 和 `jim.ns.cloudflare.com`。
Railway 已验证两个域名的所有权，并签发有效证书。
中文首页和英文首页返回 200，`www` 返回 301 并保留路径和查询参数。

| 主机名 | 类型 | 当前 Railway 目标 | 原 Netlify 值 |
| --- | --- | --- | --- |
| `@` | CNAME | `4wldarhf.up.railway.app` | A `75.2.60.5` |
| `www` | CNAME | `lvxf794o.up.railway.app` | CNAME `elastic-gates-3455af.netlify.app` |

Cloudflare 根域名使用 CNAME flattening，公共 A 记录返回 Railway 地址。
`_railway-verify` 和 `_railway-verify.www` 两条 TXT 已分别完成域名验证。
维护者应保留域名验证 TXT，保留邮件和其他子域名的记录。

## 维护者可以恢复 Netlify 的 DNS 指向

Netlify 保留现有项目和部署。维护者回退前，需要先重新启用 Netlify 项目。
维护者可在项目配置的 Danger zone 选择 Enable project。
维护者随后可恢复上表中的原有 DNS 值来回退。
维护者还应恢复切换前保存的 TTL 和代理设置，再检查 HTTPS。
维护者不应删除 Netlify 网站或解除 Netlify 的正式域名绑定。
