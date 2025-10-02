#!/bin/bash

# PV Simulator Control Script
# Easy start/stop/status control for the PV Simulator

SERVICE_NAME="pv-simulator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_help() {
    echo "PV Simulator Control Script"
    echo "=========================="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the PV Simulator service"
    echo "  stop      - Stop the PV Simulator service"
    echo "  restart   - Restart the PV Simulator service"
    echo "  status    - Show service status"
    echo "  logs      - Show service logs (follow mode)"
    echo "  logs-tail - Show last 50 log lines"
    echo "  enable    - Enable auto-start on boot (NOT recommended)"
    echo "  disable   - Disable auto-start on boot"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 logs"
}

start_service() {
    print_status "Starting PV Simulator service..."
    sudo systemctl start $SERVICE_NAME
    
    if [ $? -eq 0 ]; then
        print_status "✅ PV Simulator started successfully!"
        print_info "🌐 Web Dashboard: http://17.91.30.165:3000"
        print_info "📊 REST API: http://17.91.30.165:3000/api"
        print_info "🔌 Modbus PV1: 17.91.30.165:10502"
        print_info "🔌 Modbus PV2: 17.91.30.165:10503"
        print_info "🔌 Modbus Battery: 17.91.30.165:10504"
    else
        print_error "❌ Failed to start PV Simulator service"
        exit 1
    fi
}

stop_service() {
    print_status "Stopping PV Simulator service..."
    sudo systemctl stop $SERVICE_NAME
    
    if [ $? -eq 0 ]; then
        print_status "✅ PV Simulator stopped successfully!"
    else
        print_error "❌ Failed to stop PV Simulator service"
        exit 1
    fi
}

restart_service() {
    print_status "Restarting PV Simulator service..."
    sudo systemctl restart $SERVICE_NAME
    
    if [ $? -eq 0 ]; then
        print_status "✅ PV Simulator restarted successfully!"
        print_info "🌐 Web Dashboard: http://17.91.30.165:3000"
    else
        print_error "❌ Failed to restart PV Simulator service"
        exit 1
    fi
}

show_status() {
    print_info "PV Simulator Service Status:"
    echo ""
    sudo systemctl status $SERVICE_NAME --no-pager
    echo ""
    
    # Check if ports are listening
    print_info "Port Status:"
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "✅ Web Dashboard (port 3000) - Active"
    else
        print_warning "❌ Web Dashboard (port 3000) - Not listening"
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":10502 "; then
        print_status "✅ Modbus PV1 (port 10502) - Active"
    else
        print_warning "❌ Modbus PV1 (port 10502) - Not listening"
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":10503 "; then
        print_status "✅ Modbus PV2 (port 10503) - Active"
    else
        print_warning "❌ Modbus PV2 (port 10503) - Not listening"
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":10504 "; then
        print_status "✅ Modbus Battery (port 10504) - Active"
    else
        print_warning "❌ Modbus Battery (port 10504) - Not listening"
    fi
}

show_logs() {
    print_info "Showing PV Simulator logs (Press Ctrl+C to exit):"
    echo ""
    sudo journalctl -u $SERVICE_NAME -f
}

show_logs_tail() {
    print_info "Last 50 lines of PV Simulator logs:"
    echo ""
    sudo journalctl -u $SERVICE_NAME -n 50 --no-pager
}

enable_autostart() {
    print_warning "⚠️  WARNING: This will enable auto-start on boot!"
    print_warning "The PV Simulator will start automatically when the Pi boots up."
    read -p "Are you sure you want to enable auto-start? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Enabling auto-start on boot..."
        sudo systemctl enable $SERVICE_NAME
        print_status "✅ Auto-start enabled"
    else
        print_info "Auto-start not enabled"
    fi
}

disable_autostart() {
    print_status "Disabling auto-start on boot..."
    sudo systemctl disable $SERVICE_NAME
    print_status "✅ Auto-start disabled"
}

# Main script logic
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-tail)
        show_logs_tail
        ;;
    enable)
        enable_autostart
        ;;
    disable)
        disable_autostart
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
