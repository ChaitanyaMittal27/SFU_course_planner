#!/usr/bin/env python3
"""Interactive RMP backend client. Standard library only; never connects to a DB."""
import argparse
import json
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


def lookup(base_url, name, dept):
    url = base_url.rstrip('/') + '/api/rmp?' + urlencode({'name': name, 'deptCode': dept})
    request = Request(url, headers={'Accept': 'application/json'})
    started = time.monotonic()
    try:
        with urlopen(request, timeout=75) as response:
            return response.status, json.load(response), time.monotonic() - started
    except HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            pass
        return exc.code, body, time.monotonic() - started


def show(base_url, name, dept):
    try:
        code, body, elapsed = lookup(base_url, name, dept)
        print(f'\nHTTP {code} — {elapsed:.2f}s')
        print(json.dumps(body, indent=2, ensure_ascii=False))
        return code < 400
    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        print(f'Backend request failed: {exc}')
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:5000')
    parser.add_argument('--name', help='One raw CourseSys name, e.g. "Fraser, Brian"')
    parser.add_argument('--dept', help='Department code, e.g. cmpt')
    parser.add_argument('--repeat', type=int, default=1, choices=range(1, 6), help='Repeat to compare cached response latency (1–5)')
    args = parser.parse_args()
    if urlparse(args.base_url).scheme not in ('http', 'https'):
        parser.error('--base-url must use http or https')
    if bool(args.name) != bool(args.dept):
        parser.error('--name and --dept must be supplied together')
    print(f'Backend: {args.base_url}')
    print('First lookup may contact RMP and cache a result. Repeating uses the cache; no forced refresh.')
    if args.name:
        success = True
        for _ in range(args.repeat):
            success = show(args.base_url, args.name, args.dept) and success
        return 0 if success else 1
    previous = None
    while True:
        name = input('\nCourseSys instructor name (r = repeat last, q = quit): ').strip()
        if name.lower() == 'q':
            return 0
        if name.lower() == 'r' and previous:
            show(args.base_url, *previous)
            continue
        if not name:
            continue
        dept = input('Department code: ').strip()
        previous = (name, dept)
        show(args.base_url, name, dept)


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (KeyboardInterrupt, EOFError):
        print('\nGoodbye.')
