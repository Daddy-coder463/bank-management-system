#!/bin/bash
# Manage the local (no-Homebrew) MySQL server used by this project.
# MySQL lives in ~/.local/mysql with its data in ~/.local/mysql-data.
# Usage: ./scripts/mysql-server.sh {start|stop|status}

MYSQL_HOME="$HOME/.local/mysql"
DATA_DIR="$HOME/.local/mysql-data"
SOCKET="$DATA_DIR/mysql.sock"
PID_FILE="$DATA_DIR/mysqld.pid"

case "$1" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "MySQL already running (pid $(cat "$PID_FILE"))"
      exit 0
    fi
    if [ ! -d "$DATA_DIR/mysql" ]; then
      echo "Initializing data directory..."
      "$MYSQL_HOME/bin/mysqld" --initialize-insecure \
        --basedir="$MYSQL_HOME" --datadir="$DATA_DIR"
    fi
    "$MYSQL_HOME/bin/mysqld" \
      --basedir="$MYSQL_HOME" --datadir="$DATA_DIR" \
      --bind-address=127.0.0.1 --port=3306 \
      --socket="$SOCKET" --pid-file="$PID_FILE" \
      --log-error="$DATA_DIR/error.log" --daemonize
    echo "MySQL started (127.0.0.1:3306, root with no password)"
    ;;
  stop)
    if [ -f "$PID_FILE" ]; then
      kill "$(cat "$PID_FILE")" && echo "MySQL stopped"
    else
      echo "MySQL is not running"
    fi
    ;;
  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "MySQL running (pid $(cat "$PID_FILE"))"
    else
      echo "MySQL is not running"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
