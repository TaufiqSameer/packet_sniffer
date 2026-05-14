#!/usr/bin/env python3
"""
Packet Sniffer — uses Scapy to capture network packets and
streams them to the Node.js backend via HTTP POST.

Run with Administrator/root privileges:
  Windows:  Run PowerShell as Administrator, then: python capture/sniffer.py
  Linux:    sudo python3 capture/sniffer.py
"""

import time
import threading
import requests
from collections import defaultdict
from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw

BACKEND_URL = "http://localhost:5000/api/ingest"
BATCH_INTERVAL = 0.5   # seconds between POSTs
MAX_BATCH = 100        # max packets per POST

packet_queue: list[dict] = []
queue_lock = threading.Lock()


def get_protocol(pkt) -> str:
    if pkt.haslayer(TCP):
        return "TCP"
    elif pkt.haslayer(UDP):
        return "UDP"
    elif pkt.haslayer(ICMP):
        return "ICMP"
    return "OTHER"


def packet_handler(pkt):
    if not pkt.haslayer(IP):
        return

    ip = pkt[IP]
    protocol = get_protocol(pkt)
    src_port = 0
    dst_port = 0

    if pkt.haslayer(TCP):
        src_port = pkt[TCP].sport
        dst_port = pkt[TCP].dport
    elif pkt.haslayer(UDP):
        src_port = pkt[UDP].sport
        dst_port = pkt[UDP].dport

    record = {
        "timestamp": time.time(),
        "src_ip": ip.src,
        "dst_ip": ip.dst,
        "protocol": protocol,
        "src_port": src_port,
        "dst_port": dst_port,
        "length": len(pkt),
    }

    with queue_lock:
        packet_queue.append(record)


def flush_loop():
    """Periodically POST queued packets to the backend."""
    while True:
        time.sleep(BATCH_INTERVAL)
        with queue_lock:
            if not packet_queue:
                continue
            batch = packet_queue[:MAX_BATCH]
            del packet_queue[:MAX_BATCH]

        try:
            resp = requests.post(
                BACKEND_URL,
                json={"packets": batch},
                timeout=2,
            )
            print(f"[sniffer] flushed {len(batch)} packets → {resp.status_code}")
        except requests.exceptions.ConnectionError:
            print("[sniffer] backend not reachable — will retry")
        except Exception as e:
            print(f"[sniffer] error: {e}")


if __name__ == "__main__":
    print("=" * 50)
    print("  Packet Sniffer — powered by Scapy")
    print(f"  Sending to: {BACKEND_URL}")
    print("  Press Ctrl+C to stop")
    print("=" * 50)

    # Start flush thread
    flush_thread = threading.Thread(target=flush_loop, daemon=True)
    flush_thread.start()

    try:
        # iface=None → auto-detect default interface
        sniff(prn=packet_handler, store=False, filter="ip")
    except KeyboardInterrupt:
        print("\n[sniffer] stopped.")
    except PermissionError:
        print("[sniffer] ERROR: Run as Administrator (Windows) or with sudo (Linux/Mac)")
