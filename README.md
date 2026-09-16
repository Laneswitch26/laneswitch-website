# LANE SWITCH – Cloudflare staging

Source: design preview version 5, commit 29a23e380ed378dd996ba18db0af1e8e27c3def3.

Cloudflare Pages settings: production branch cloudflare-online, framework None, no build command, output dist, repository root unchanged.

This branch is separate from main and contains no GitHub Actions workflows. Public laneswitch.de is unchanged.

This is a staging copy, not ready for public launch: PWA installation is not implemented, production URLs and privacy disclosures need final review. robots.txt and X-Robots-Tag discourage indexing but are not access control. The comparison link opens existing laneswitch.de. Original binary assets are retained by blob SHA.

## Contact update

The inquiry form now opens a percent-encoded mailto message directly after native form validation. Name whitespace is rejected. Learner and school drafts remain separate and in memory only. An inline readonly message and copy button offer a fallback if no mail client opens; no sent status is claimed. Telephone/email links on detail pages are enabled. No server storage or automatic sending. Pure message serialization verified for both audiences, umlauts, special characters and multiline content. No test email sent. PWA and domain migration remain separate work.
