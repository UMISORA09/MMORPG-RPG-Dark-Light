#!/bin/sh
set -e

echo "=========================================================="
echo "🐉 CHIẾN LONG BÁ — API SERVER & WEBSOCKET GATEWAY"
echo "=========================================================="

PG_HOST="${PGHOST:-postgres}"
PG_PORT="${PGPORT:-5432}"
PG_USER="${POSTGRES_USER:-game_user}"
PG_DB="${POSTGRES_DB:-game_mmorpg}"

echo "⏳ [CLB-API] Đang kiểm tra kết nối CSDL PostgreSQL (${PG_HOST}:${PG_PORT}/${PG_DB})..."
until pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB"; do
  echo "⏳ [CLB-API] Chờ PostgreSQL khởi động..."
  sleep 2
done

echo "✅ [CLB-API] Kết nối PostgreSQL thành công!"

cd /app

echo "📦 [CLB-API] Đang đồng bộ CSDL và nạp dữ liệu mẫu (pnpm run db:setup)..."
pnpm run db:setup || {
  echo "⚠️ [CLB-API] db:setup hoàn tất với cảnh báo (bảng đã tồn tại hoặc đã được nạp)."
}

echo "🎮 [CLB-API] Khởi động Chiến Long Bá API Server trên cổng ${PORT:-3001}..."
exec node --enable-source-maps ./artifacts/api-server/dist/index.mjs