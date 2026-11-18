#!/usr/bin/env python3
"""Serve Dragon Claw Challenge and bridge browser commands to XLOT-Hermes."""
import argparse
import json
import threading
import time
import urllib.request
import socket
import ipaddress
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

def discover_xlot(preferred=None):
    """Use only the explicitly configured XLOT address; no subnet scanning."""
    return preferred or None


class XLOT:
    def __init__(self, host):
        self.host = host
        self.url = "http://" + host if host else None
        self.last_scan = 0
        self.scan_lock = threading.Lock()
        self.mode = "S"
        self.lock = threading.Lock()
        self.last_command = time.monotonic()
        self.running = True
        threading.Thread(target=self.heartbeat, daemon=True).start()

    def reconnect(self):
        with self.scan_lock:
            if self.url and time.monotonic() - self.last_scan < 8:
                return
            self.last_scan = time.monotonic()
            host = discover_xlot(self.host)
            if host:
                self.host = host
                self.url = "http://" + host

    def request(self, endpoint):
        if not self.url:
            self.reconnect()
        if not self.url:
            raise ConnectionError("XLOT not found on the current network")
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            with opener.open(self.url + endpoint, timeout=2) as response:
                return response.read().decode()
        except (OSError, TimeoutError):
            self.url = None
            self.reconnect()
            if not self.url:
                raise ConnectionError("XLOT unreachable; check configured IP and hotspot")
            with opener.open(self.url + endpoint, timeout=2) as response:
                return response.read().decode()

    def command(self, mode):
        if mode not in ("W", "R", "T", "S"):
            raise ValueError("Invalid mode")
        with self.lock:
            if mode != "S":
                state = json.loads(self.request("/status"))
                if state.get("ready") is False:
                    raise ConnectionError("PCA9685 not detected by XLOT; motor commands disabled")
            result = self.request("/command?mode=" + mode)
            self.mode = mode
            self.last_command = time.monotonic()
            return result

    def heartbeat(self):
        while self.running:
            time.sleep(2)
            with self.lock:
                if self.mode != "S":
                    try:
                        if time.monotonic()-self.last_command > 120:
                            self.request("/command?mode=S")
                            self.mode = "S"
                        else:
                            self.request("/heartbeat")
                    except Exception as exc:
                        print("XLOT heartbeat:", exc)
                        self.mode = "S"

class Handler(SimpleHTTPRequestHandler):
    def respond(self, code, obj):
        data=json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(data)))
        self.send_header("Cache-Control","no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        p=urlsplit(self.path)
        if p.path == "/api/wearable/command":
            mode=parse_qs(p.query).get("mode",[""])[0].upper()
            try:
                self.server.xlot.command(mode)
                self.respond(200,{"ok":True,"mode":mode})
            except Exception as exc:
                self.respond(503,{"ok":False,"error":str(exc)})
        elif p.path == "/api/wearable/stop":
            try:
                self.server.xlot.command("S")
                self.respond(200,{"ok":True})
            except Exception as exc:
                self.respond(503,{"ok":False,"error":str(exc)})
        else:
            self.respond(404,{"ok":False,"error":"Unknown endpoint"})

    def do_GET(self):
        if urlsplit(self.path).path == "/api/wearable/status":
            try:
                raw=self.server.xlot.request("/status")
                device=json.loads(raw)
                self.respond(200,{"ok":True,**device,"motor_count":len(device.get("motors",[])) if isinstance(device.get("motors"),list) else 1})
            except Exception as exc:
                self.respond(503,{"ok":False,"error":str(exc)})
        else:
            super().do_GET()

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--xlot",required=True,help="Current XLOT IP or hostname on the same hotspot")
    parser.add_argument("--port",type=int,default=8765)
    args=parser.parse_args()
    root=Path(__file__).resolve().parent/"dist"
    import os
    os.chdir(root)
    server=ThreadingHTTPServer(("127.0.0.1",args.port),Handler)
    server.xlot=XLOT(args.xlot)
    server.xlot.reconnect()
    print(f"Open http://localhost:{args.port} (XLOT: {server.xlot.host or 'not found yet'})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.xlot.running=False
        try: server.xlot.command("S")
        except Exception: pass
        server.server_close()
