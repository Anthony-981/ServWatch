"""
System Metrics Collector
Collects CPU, Memory, Disk, Network, GPU, and Temperature metrics
"""

import math
import psutil
import platform
import socket
import subprocess
import threading
import time
from typing import Dict, List, Optional, Any

try:
    import pynvml
except ImportError:
    pynvml = None


class SystemCollector:
    """Collects system metrics using psutil and pynvml"""

    def __init__(self, enable_gpu: bool = True):
        """
        Initialize the system collector.

        Args:
            enable_gpu: Whether to collect GPU metrics (requires pynvml)
        """
        self.enable_gpu = enable_gpu
        self.gpu_available = False
        self.nvml_initialized = False

        # Network stats tracking for rate calculation
        self._last_network_stats = None
        self._last_network_time = None
        self._network_lock = threading.Lock()

        # Disk IO stats tracking
        self._last_disk_stats = None
        self._last_disk_time = None
        self._disk_lock = threading.Lock()

        # Initialize NVML if GPU monitoring is enabled
        if self.enable_gpu:
            self._init_nvml()

    def _init_nvml(self):
        """Initialize NVIDIA ML library for GPU monitoring"""
        if pynvml is None:
            print("pynvml not installed, GPU monitoring disabled")
            self.gpu_available = False
            return

        try:
            pynvml.nvmlInit()
            self.gpu_available = True
            self.nvml_initialized = True
            device_count = pynvml.nvmlDeviceGetCount()
            print(f"GPU monitoring enabled: {device_count} NVIDIA GPU(s) detected")
        except Exception as e:
            print(f"GPU monitoring not available: {e}")
            self.gpu_available = False
            self.nvml_initialized = False

    def collect_all(self) -> Optional[Dict[str, Any]]:
        """
        Collect all system metrics.

        Returns:
            Dictionary containing all metrics or None if collection fails
        """
        try:
            metrics = {
                'timestamp': int(time.time() * 1000),
                'cpu': self.collect_cpu(),
                'memory': self.collect_memory(),
                'disk': self.collect_disk(),
                'network': self.collect_network(),
                'gpu': self.collect_gpu() if self.gpu_available else {},
                'temperatures': self.collect_temperatures(),
                'processes': self.collect_processes()
            }
            return metrics
        except Exception as e:
            print(f"Error collecting metrics: {e}")
            return None

    def collect_cpu(self) -> Dict[str, Any]:
        """Collect CPU metrics"""
        try:
            # CPU usage per core
            cpu_percents = psutil.cpu_percent(interval=0.1, percpu=True)

            # Load averages (Linux/Unix only)
            load_avg = list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else [0, 0, 0]

            # CPU frequency
            freq = psutil.cpu_freq()

            # CPU info
            cpu_info = {
                'usage': psutil.cpu_percent(interval=0.1),
                'loadAverage': load_avg,
                'cores': psutil.cpu_count(logical=True),
                'physicalCores': psutil.cpu_count(logical=False),
                'model': platform.processor() or 'Unknown',
                'manufacturer': platform.machine(),
                'speed': freq.current if freq else 0,
                'minSpeed': freq.min if freq else 0,
                'maxSpeed': freq.max if freq else 0,
                'temperature': 0  # Will be updated in temperatures
            }
            return cpu_info
        except Exception as e:
            print(f"Error collecting CPU metrics: {e}")
            return {'usage': 0, 'cores': psutil.cpu_count()}

    def collect_memory(self) -> Dict[str, Any]:
        """Collect memory metrics"""
        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()

            return {
                'total': mem.total,
                'used': mem.used,
                'free': mem.available,
                'active': getattr(mem, 'active', mem.used),  # Windows compatible
                'cached': getattr(mem, 'cached', 0),
                'buffers': getattr(mem, 'buffers', 0),
                'swapTotal': swap.total,
                'swapUsed': swap.used,
                'swapFree': swap.free,
                'percentage': mem.percent
            }
        except Exception as e:
            print(f"Error collecting memory metrics: {e}")
            return {'total': 0, 'used': 0, 'percentage': 0}

    def collect_disk(self) -> Dict[str, Any]:
        """Collect disk metrics"""
        try:
            # Get disk partitions
            partitions = []
            for part in psutil.disk_partitions(all=False):
                if part.fstype == 'squashfs':
                    continue  # Skip snap filesystems
                try:
                    usage = psutil.disk_usage(part.mountpoint)
                    partitions.append({
                        'device': part.device,
                        'mountpoint': part.mountpoint,
                        'fstype': part.fstype,
                        'total': usage.total,
                        'used': usage.used,
                        'free': usage.free,
                        'usePercent': usage.percent
                    })
                except PermissionError:
                    continue

            # Get disk I/O stats
            disk_io = self._get_disk_io_rates()

            return {
                'drives': partitions,
                'io': disk_io
            }
        except Exception as e:
            print(f"Error collecting disk metrics: {e}")
            return {'drives': [], 'io': {}}

    def _get_disk_io_rates(self) -> Optional[Dict[str, float]]:
        """Calculate disk I/O rates (bytes/sec)"""
        try:
            with self._disk_lock:
                current_stats = psutil.disk_io_counters()
                current_time = time.time()

                if self._last_disk_stats is None or self._last_disk_time is None:
                    self._last_disk_stats = current_stats
                    self._last_disk_time = current_time
                    return None

                time_delta = current_time - self._last_disk_time
                if time_delta <= 0:
                    return None

                read_bytes = current_stats.read_bytes - self._last_disk_stats.read_bytes
                write_bytes = current_stats.write_bytes - self._last_disk_stats.write_bytes
                read_count = current_stats.read_count - self._last_disk_stats.read_count
                write_count = current_stats.write_count - self._last_disk_stats.write_count

                self._last_disk_stats = current_stats
                self._last_disk_time = current_time

                return {
                    'readBytes': max(0, read_bytes),
                    'writeBytes': max(0, write_bytes),
                    'readCount': max(0, read_count),
                    'writeCount': max(0, write_count),
                    'readBytes_sec': max(0, read_bytes / time_delta),
                    'writeBytes_sec': max(0, write_bytes / time_delta),
                    'readCount_sec': max(0, read_count / time_delta),
                    'writeCount_sec': max(0, write_count / time_delta)
                }
        except Exception as e:
            print(f"Error calculating disk I/O rates: {e}")
            return None

    def collect_network(self) -> Dict[str, Any]:
        """Collect network metrics"""
        try:
            # Get network interfaces
            interfaces = []
            stats_list = []

            for name, addrs in psutil.net_if_addrs().items():
                iface_info = {
                    'name': name,
                    'ip4': None,
                    'ip6': None,
                    'mac': None
                }
                for addr in addrs:
                    if addr.family == 2:  # AF_INET
                        iface_info['ip4'] = addr.address
                    elif addr.family == 10:  # AF_INET6
                        iface_info['ip6'] = addr.address
                    elif addr.family == 17:  # AF_PACKET
                        iface_info['mac'] = addr.address

                # Get interface stats
                try:
                    stats = psutil.net_if_stats()[name]
                    iface_info.update({
                        'speed': stats.speed,
                        'duplex': stats.duplex,
                        'mtu': stats.mtu,
                        'isup': stats.isup
                    })
                except KeyError:
                    pass

                interfaces.append(iface_info)

            # Get network I/O stats
            net_io = self._get_network_io_rates()

            return {
                'interfaces': interfaces,
                'stats': net_io['stats'] if net_io else [],
                'totalRx': net_io['totalRx'] if net_io else 0,
                'totalTx': net_io['totalTx'] if net_io else 0
            }
        except Exception as e:
            print(f"Error collecting network metrics: {e}")
            return {'interfaces': [], 'stats': [], 'totalRx': 0, 'totalTx': 0}

    def _get_network_io_rates(self) -> Optional[Dict[str, Any]]:
        """Calculate network I/O rates (bytes/sec)"""
        try:
            with self._network_lock:
                current_stats = psutil.net_io_counters(pernic=True)
                current_time = time.time()

                if self._last_network_stats is None or self._last_network_time is None:
                    self._last_network_stats = current_stats
                    self._last_network_time = current_time
                    return None

                time_delta = current_time - self._last_network_time
                if time_delta <= 0:
                    return None

                stats_list = []
                total_rx = 0
                total_tx = 0

                for name, stats in current_stats.items():
                    last_stats = self._last_network_stats.get(name)
                    if last_stats is None:
                        continue

                    rx_bytes = max(0, stats.bytes_recv - last_stats.bytes_recv)
                    tx_bytes = max(0, stats.bytes_sent - last_stats.bytes_sent)

                    total_rx += rx_bytes
                    total_tx += tx_bytes

                    stats_list.append({
                        'iface': name,
                        'rx_bytes': stats.bytes_recv,
                        'tx_bytes': stats.bytes_sent,
                        'rx_packets': stats.packets_recv,
                        'tx_packets': stats.packets_sent,
                        'rx_sec': rx_bytes / time_delta,
                        'tx_sec': tx_bytes / time_delta
                    })

                self._last_network_stats = current_stats
                self._last_network_time = current_time

                return {
                    'stats': stats_list,
                    'totalRx': total_rx / time_delta if time_delta > 0 else 0,
                    'totalTx': total_tx / time_delta if time_delta > 0 else 0
                }
        except Exception as e:
            print(f"Error calculating network I/O rates: {e}")
            return None

    def collect_gpu(self) -> Dict[str, Any]:
        """Collect NVIDIA GPU metrics"""
        if not self.gpu_available or not self.nvml_initialized:
            return {'controllers': [], 'count': 0, 'avgUsage': 0}

        try:
            device_count = pynvml.nvmlDeviceGetCount()
            controllers = []
            total_vram = 0
            total_vram_used = 0
            total_usage = 0
            max_temp = 0

            for i in range(device_count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)

                # Get GPU name
                name = pynvml.nvmlDeviceGetName(handle)

                # Get memory info
                mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                vram_total = mem_info.total
                vram_used = mem_info.used
                vram_free = mem_info.free

                # Get utilization
                utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                gpu_util = utilization.gpu
                mem_util = utilization.memory

                # Get temperature
                try:
                    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                except:
                    temp = 0

                # Get power usage
                try:
                    power = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000  # Convert to watts
                except:
                    power = 0

                # Get fan speed
                try:
                    fan = pynvml.nvmlDeviceGetFanSpeed(handle)
                except:
                    fan = 0

                # Get clock speeds
                try:
                    clock_graphics = pynvml.nvmlDeviceGetClockInfo(handle, pynvml.NVML_CLOCK_GRAPHICS)
                    clock_memory = pynvml.nvmlDeviceGetClockInfo(handle, pynvml.NVML_CLOCK_MEM)
                except:
                    clock_graphics = 0
                    clock_memory = 0

                controllers.append({
                    'vendor': 'NVIDIA',
                    'model': name.decode('utf-8') if isinstance(name, bytes) else name,
                    'index': i,
                    'vram': vram_total,
                    'vramUsed': vram_used,
                    'vramFree': vram_free,
                    'vramPercentage': (vram_used / vram_total * 100) if vram_total > 0 else 0,
                    'usage': gpu_util,
                    'memoryUsage': mem_util,
                    'temperature': temp,
                    'powerUsage': power,
                    'fanSpeed': fan,
                    'clockSpeed': clock_graphics,
                    'memoryClockSpeed': clock_memory
                })

                total_vram += vram_total
                total_vram_used += vram_used
                total_usage += gpu_util
                max_temp = max(max_temp, temp)

            avg_usage = total_usage / device_count if device_count > 0 else 0

            return {
                'controllers': controllers,
                'totalVRAM': total_vram,
                'totalVRAMUsed': total_vram_used,
                'totalVRAMFree': total_vram - total_vram_used,
                'vramPercentage': (total_vram_used / total_vram * 100) if total_vram > 0 else 0,
                'avgUsage': avg_usage,
                'maxTemperature': max_temp,
                'count': device_count
            }
        except Exception as e:
            print(f"Error collecting GPU metrics: {e}")
            return {'controllers': [], 'count': 0, 'avgUsage': 0}

    def collect_temperatures(self) -> Dict[str, Any]:
        """Collect temperature metrics"""
        try:
            temps = {}

            # CPU temperature (if available)
            if hasattr(psutil, 'sensors_temperatures'):
                sensor_temps = psutil.sensors_temperatures()
                for name, entries in sensor_temps.items():
                    if entries:
                        current_temps = [e.current for e in entries if e.current > 0]
                        if current_temps:
                            temps[name] = {
                                'current': sum(current_temps) / len(current_temps),
                                'max': max(current_temps),
                                'cores': current_temps
                            }

            # Get CPU temp from GPU collector (more accurate)
            cpu_temp = 0
            if self.gpu_available and self.nvml_initialized:
                try:
                    # Try to get CPU temp from NVML (for Jetson devices)
                    device_count = pynvml.nvmlDeviceGetCount()
                    for i in range(device_count):
                        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                        try:
                            temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                            cpu_temp = max(cpu_temp, temp)
                        except:
                            pass
                except:
                    pass

            # Max temperature
            max_temp = 0
            all_temps = []
            for temp_data in temps.values():
                if isinstance(temp_data, dict):
                    all_temps.append(temp_data.get('current', 0))
                    all_temps.append(temp_data.get('max', 0))

            if all_temps:
                max_temp = max(all_temps)

            return {
                'cpu': cpu_temp,
                'sensors': temps,
                'max': max_temp,
                'cores': temps.get('core', {}).get('cores', []) if isinstance(temps.get('core'), dict) else []
            }
        except Exception as e:
            print(f"Error collecting temperature metrics: {e}")
            return {'cpu': 0, 'sensors': {}, 'max': 0}

    def collect_processes(self) -> Dict[str, Any]:
        """Collect process information"""
        try:
            procs = []
            status_counts = {}

            # Iterate through all processes
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'username', 'status']):
                try:
                    pinfo = proc.info
                    if pinfo.get('name') is None:
                        continue

                    # Count by status
                    status = pinfo.get('status', 'unknown')
                    status_counts[status] = status_counts.get(status, 0) + 1

                    procs.append({
                        'pid': pinfo.get('pid'),
                        'name': pinfo.get('name'),
                        'cpu': pinfo.get('cpu_percent', 0) or 0,
                        'memory': pinfo.get('memory_percent', 0) or 0,
                        'user': pinfo.get('username', 'unknown'),
                        'status': status
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            # Sort by CPU
            top_cpu = sorted(procs, key=lambda p: p['cpu'], reverse=True)[:10]

            # Sort by memory
            top_mem = sorted(procs, key=lambda p: p['memory'], reverse=True)[:10]

            return {
                'total': len(procs),
                'running': status_counts.get('running', 0),
                'sleeping': status_counts.get('sleeping', 0),
                'stopped': status_counts.get('stopped', 0),
                'zombie': status_counts.get('zombie', 0),
                'topByCPU': top_cpu,
                'topByMemory': top_mem
            }
        except Exception as e:
            print(f"Error collecting process metrics: {e}")
            return {'total': 0, 'topByCPU': [], 'topByMemory': []}

    def get_system_info(self) -> Dict[str, Any]:
        """Get static system information (collected once)"""
        try:
            boot_time = psutil.boot_time()

            return {
                'hostname': socket.gethostname(),
                'platform': platform.system(),
                'platformRelease': platform.release(),
                'platformVersion': platform.version(),
                'architecture': platform.machine(),
                'processor': platform.processor(),
                'cpu': {
                    'cores': psutil.cpu_count(logical=True),
                    'physicalCores': psutil.cpu_count(logical=False),
                    'frequency': psutil.cpu_freq().current if psutil.cpu_freq() else 0
                },
                'memory': {
                    'total': psutil.virtual_memory().total,
                    'totalSwap': psutil.swap_memory().total
                },
                'uptime': time.time() - boot_time
            }
        except Exception as e:
            print(f"Error getting system info: {e}")
            return {}


def format_bytes(bytes_value: float) -> str:
    """Format bytes to human readable string"""
    if bytes_value == 0:
        return '0 B'
    k = 1024
    sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    i = int(math.log(bytes_value) / math.log(k)) if bytes_value > 0 else 0
    return f'{bytes_value / (k ** i):.1f} {sizes[i]}'
