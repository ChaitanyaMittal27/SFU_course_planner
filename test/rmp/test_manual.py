import io
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import manual


class ManualClientTest(unittest.TestCase):
    def test_encodes_names_without_changing_department(self):
        class Response(io.BytesIO):
            status = 200
        with patch('manual.urlopen', return_value=Response(b'{"status":"NO_MATCH"}')) as request:
            status, body, _ = manual.lookup('http://localhost:5000/', "O'Doherty, Tamara", 'crim')
        self.assertEqual(200, status)
        self.assertEqual('NO_MATCH', body['status'])
        self.assertIn('name=O%27Doherty%2C+Tamara&deptCode=crim', request.call_args.args[0].full_url)

    def test_preserves_backend_error_body(self):
        error = HTTPError('http://localhost', 400, 'Bad request', {}, io.BytesIO(b'{"message":"Invalid name"}'))
        with patch('manual.urlopen', side_effect=error):
            status, body, _ = manual.lookup('http://localhost', '?', 'cmpt')
        self.assertEqual(400, status)
        self.assertEqual('Invalid name', body['message'])


if __name__ == '__main__':
    unittest.main()
