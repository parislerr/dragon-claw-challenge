#!/usr/bin/env python3
"""Serve Dragon Claw Challenge and bridge browser commands to XLOT-Hermes."""
import argparse
import json
import threading
import time
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

class XLOT:
    def __init__(self, host):
        self.url = "http://" + host
        self.mode = "S"
        self.lock = threading.Lock()
        self.last_command = time.monotonic()
        self.running = True
        threading.Thread(target=self.heartbeat, daemon=True).start()

    def request(self, endpoint):
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(self.url + endpoint, timeout=3) as response:
            return response.read().decode()

    def command(self, mode):
        if mode not in ("W", "R", "T", "S"):
            raise ValueError("Invalid mode")
        with self.lock:
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
                self.respond(200,{"ok":True,**json.loads(raw)})
            except Exception as exc:
                self.respond(503,{"ok":False,"error":str(exc)})
        else:
            super().do_GET()

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--xlot",default="xlot-hermes.local")
    parser.add_argument("--port",type=int,default=8765)
    args=parser.parse_args()
    root=Path(__file__).resolve().parent/"dist"
    import os
    os.chdir(root)
    server=ThreadingHTTPServer(("127.0.0.1",args.port),Handler)
    server.xlot=XLOT(args.xlot)
    print(f"Open http://localhost:{args.port} (XLOT: {args.xlot})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.xlot.running=False
        try: server.xlot.command("S")
        except Exception: pass
        server.server_close()
