# RMP manual client

`manual.py` calls a running backend's `GET /api/rmp` and prints the response and timing.
Python 3 standard library only; it never touches the database.

```powershell
python test/rmp/manual.py                                    # interactive
python test/rmp/manual.py --name "Hall, Margaret" --dept als
python test/rmp/manual.py --base-url http://127.0.0.1:5000   # default
python -m unittest discover -s test/rmp -p "test_*.py"       # its own tests
```

Some of its printed messages still describe the earlier cache design; the requests themselves
match the current API. See `agent-docs/rmp.md` for how lookups work.
