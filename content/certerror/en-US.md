---
namespace: others
language: en-US
key: cert_error_markdown
---

There is a certificate error occurred. It may be caused by using a proxy with self-assigned certificate, or under a man-in-a-middle attack.

This certificate is assigned by **{{name}}** and its sha256 value is **{{value}}**.

Press `Trust` will allow all connections using this certificate, or these connections will remain blocked.

Trust this certificate only when its assgined by a trusted provider(e.g. your proxy provider).

If you're using a proxy with self-assigned certificate, it's recommended to import your proxy providers self-assigned root CA.
