#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="https://github.com/DragonChenCL/InchUp.git"

info() { printf '\n[寸进] %s\n' "$*"; }
fail() { printf '\n[寸进] %s\n' "$*" >&2; exit 1; }

main() {
  local script_dir project_dir git_root remote branch changes config
  script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

  command -v docker >/dev/null 2>&1 || fail "请先安装 Docker Engine 和 Docker Compose 插件：https://docs.docker.com/engine/install/"
  docker info >/dev/null 2>&1 || fail "无法连接 Docker，请确认服务已启动，且当前用户有权限运行 Docker。"
  docker compose version >/dev/null 2>&1 || fail "未找到 Docker Compose 插件，请安装 docker compose。"
  docker compose up --help | grep -- '--wait-timeout' >/dev/null || fail "请升级 Docker Compose，当前版本不支持等待服务就绪。"

  # 在仓库中直接部署；单独下载脚本时，将仓库克隆到当前目录的 InchUp 子目录。
  if [[ -f "$script_dir/package.json" && -f "$script_dir/compose.yaml" ]]; then
    project_dir="$script_dir"
  else
    command -v git >/dev/null 2>&1 || fail "请先安装 Git。"
    project_dir="${INCHUP_DIR:-$PWD/InchUp}"
    [[ ! -e "$project_dir" ]] || fail "目标目录已存在：$project_dir。请进入已有仓库执行 deploy.sh，或设置 INCHUP_DIR 指向新目录。"
    info "正在克隆代码仓库到 $project_dir"
    git clone --branch main "$REPO_URL" "$project_dir"
  fi

  cd -- "$project_dir"
  project_dir="$(pwd -P)"
  if [[ -e .git ]]; then
    command -v git >/dev/null 2>&1 || fail "请先安装 Git，以便更新代码。"
    git_root="$(git rev-parse --show-toplevel)"
    [[ "$(cd -- "$git_root" && pwd -P)" == "$project_dir" ]] || fail "部署目录与 Git 仓库根目录不一致。"
    remote="$(git remote get-url origin)"
    case "$remote" in
      https://github.com/DragonChenCL/InchUp|https://github.com/DragonChenCL/InchUp.git|git@github.com:DragonChenCL/InchUp.git) ;;
      *) fail "当前 origin 不是 InchUp 仓库，请确认目录后再部署。" ;;
    esac
    branch="$(git symbolic-ref --quiet --short HEAD)" || fail "当前处于分离 HEAD 状态，请切换到需要部署的分支。"
    changes="$(git status --porcelain)"
    [[ -z "$changes" ]] || fail "仓库存在未提交改动。请先提交或另行保存，再执行部署；脚本不会覆盖本地修改。"
    info "正在更新 $branch 分支"
    git pull --ff-only origin "$branch"
  fi

  if [[ ! -f .env.production ]]; then
    cp .env.docker.example .env.production
    info "已创建 .env.production。请填写 LINUX DO 应用凭证后再次执行本脚本，即可开启社区登录。"
  fi
  chmod 600 .env.production

  info "正在构建并启动 Docker 服务，首次构建需要下载依赖"
  docker compose --env-file .env.production -f compose.yaml up -d --build --wait --wait-timeout 120

  info "服务已经就绪"
  docker compose --env-file .env.production -f compose.yaml ps
  config="$(docker compose --env-file .env.production -f compose.yaml port app 5173)"
  printf '\n服务器监听：%s\n' "$config"
  printf '默认反向代理上游：http://127.0.0.1:5173\n'
  printf '站点域名：https://inchup.serunio.com\n'
  printf 'LINUX DO 回调：https://inchup.serunio.com/auth/linuxdo/callback\n'
  printf '配置文件：%s/.env.production\n' "$project_dir"
  printf '查看日志：docker compose --env-file .env.production logs -f --tail=100\n'
  printf '后续更新：bash deploy.sh\n'
}

main "$@"
