# Encrypted GitHub Pages entrypoints

All root HTML pages are generated using StatiCrypt 3.5.4 (MIT; vendored codec
and crypto engine). Edit local `../site-source/*.html`, not encrypted output.
The local dev server serves these sources in both local modes, while GitHub
Pages serves the encrypted root HTML. Keep a backup of the local sources.

After HTML edits, set `STATICRYPT_PASSWORD` in the process environment and run
`node tools/protect-site.cjs` from the site directory before publishing.
Never commit the access code, a derived decryption key, or plaintext source
copies. The build checks successful decryption and rejects a wrong code for
every HTML entrypoint. JS/CSS/catalog/media updates do not require HTML rebuilds.

The login retains only a derived key in sessionStorage for navigation within
the browser tab. Closing the tab normally clears it; browsers may restore tab
sessions. This is convenience, not a security boundary.

This is deliberately lightweight protection: a four-digit code is brute-forceable.
Media, scripts, catalogs, public repository files and previous Git history remain
public. No claim of server-side access control or confidential media storage is made.
