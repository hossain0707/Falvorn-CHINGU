import hmac
import json
import os
import secrets
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from .core import AGENTS, Model, Store, run_one

def main():
    port=int(os.environ.get("CHINGU_PORT","8765"))
    token=os.environ.get("CHINGU_TOKEN") or secrets.token_urlsafe(32)
    if len(token)<32: raise SystemExit("CHINGU_TOKEN must be at least 32 characters.")
    store=Store(os.environ.get("CHINGU_DB","chingu.sqlite3"))
    model=Model(os.environ.get("CHINGU_MODEL_URL","http://127.0.0.1:11434/v1/chat/completions"),
                os.environ.get("CHINGU_MODEL","qwen2.5:7b"),os.environ.get("CHINGU_MODEL_KEY",""))
    assets=Path(__file__).parent/"static"
    stop=threading.Event()
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(15)
        def log_message(self,*args): pass
        def send(self,status,body,kind="application/json; charset=utf-8"):
            data=body if isinstance(body,bytes) else json.dumps(body,ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type",kind)
            self.send_header("Content-Length",str(len(data)))
            self.send_header("Cache-Control","no-store")
            self.send_header("X-Content-Type-Options","nosniff")
            self.send_header("Referrer-Policy","no-referrer")
            self.send_header("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            self.end_headers()
            self.wfile.write(data)
        def valid_host(self):
            return self.headers.get("Host") in (f"127.0.0.1:{port}",f"localhost:{port}")
        def authorized(self):
            return hmac.compare_digest(self.headers.get("Authorization","").encode(),("Bearer "+token).encode())
        def guard(self):
            if not self.valid_host(): self.send(403,{"error":"Invalid host"}); return False
            origin=self.headers.get("Origin")
            if origin and origin not in (f"http://127.0.0.1:{port}",f"http://localhost:{port}"):
                self.send(403,{"error":"Invalid origin"}); return False
            if not self.authorized(): self.send(401,{"error":"Access token required"}); return False
            return True
        def do_GET(self):
            if not self.valid_host(): self.send(403,{"error":"Invalid host"}); return
            path=urlsplit(self.path).path
            static={"/":("index.html","text/html"),"/app.js":("app.js","text/javascript"),"/style.css":("style.css","text/css")}
            if path in static:
                filename,kind=static[path]
                self.send(200,(assets/filename).read_bytes(),kind+"; charset=utf-8"); return
            if not self.guard(): return
            if path=="/api/agents": self.send(200,AGENTS)
            elif path=="/api/tasks": self.send(200,store.list())
            elif path=="/api/notes": self.send(200,store.notes())
            elif path.startswith("/api/tasks/"):
                data=store.get(path.split("/")[-1]); self.send(200 if data else 404,data or {"error":"Not found"})
            else: self.send(404,{"error":"Not found"})
        def do_POST(self):
            if not self.guard(): return
            try:
                if self.headers.get_content_type()!="application/json": raise ValueError("JSON required.")
                length=int(self.headers.get("Content-Length","0"))
                if not 1<=length<=50000: raise ValueError("Invalid body size.")
                body=json.loads(self.rfile.read(length))
                if not isinstance(body,dict): raise ValueError("Object required.")
                path=urlsplit(self.path).path
                if path=="/api/tasks":
                    self.send(201,{"id":store.submit(body.get("agent"),body.get("goal"))})
                elif path.startswith("/api/tasks/") and path.endswith("/approval"):
                    store.approve(path.split("/")[-2],body.get("approved"))
                    self.send(200,{"ok":True})
                else: self.send(404,{"error":"Not found"})
            except (ValueError,TypeError,UnicodeError) as exc:
                self.send(400,{"error":str(exc)[:200]})
    server=ThreadingHTTPServer(("127.0.0.1",port),Handler)
    store.recover()
    def worker():
        while not stop.is_set():
            if not run_one(store,model): stop.wait(0.5)
    thread=threading.Thread(target=worker,daemon=True)
    thread.start()
    print(f"CHINGU — http://127.0.0.1:{port}\nAccess token: {token}",flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally:
        stop.set()
        server.server_close()

if __name__=="__main__": main()
