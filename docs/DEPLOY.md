# Putting the game online

Once this is set up, there are two sites on the server, each with its own islands:

| Site | What it's for | Gets a new version |
|---|---|---|
| **https://sarahcrossing.com** (live) | Sarah's island | only when you ask: **Actions > Deploy > Run workflow**, pick **live** |
| **https://beta.sarahcrossing.com** (beta) | trying new things first | every push to `claude/serene-mendel-8428vr` (about 5 minutes, once its tests pass) |

- **Password:** every visitor types the password once. After that, their browser remembers it for years.
  (Both sites use the same password, but each asks once.)
- **Islands:** saved on the server as you play, so an island follows you from phone to laptop.
  Each island keeps its own backups (hourly for two days, then daily for two months).

How it works: when you push, GitHub builds the game, tests it (including playing it in a real
browser) and copies it to your EC2 server. On the server, **Caddy** handles HTTPS (it gets the
padlock certificate by itself) and passes visitors to the **game server**, a small Node.js program
that checks the password, sends the game and keeps the islands.

You only need to do steps 1 to 5 once.

---

## 1. The server: Ubuntu, with a fixed address

The scripts expect **Ubuntu** (24.04 is what they're tested against), with the user `ubuntu`.

1. Sign in at <https://console.aws.amazon.com>. At the top right, check that the region is the one
   your server is in.
2. In the search box at the top, type **EC2** and open it. Click **Instances** and then your
   server's **Instance ID** (the blue link).
3. Under **Platform details** (or **AMI name**), check that it says **Ubuntu**. If it says Amazon
   Linux, it's quickest to make a new instance with Ubuntu (it's empty anyway): **Launch instance**,
   pick **Ubuntu Server 24.04**, size **t3.small** (or t3.micro), your key pair, and the security
   group from step 2.
4. **Give it an Elastic IP**, so its address never changes (otherwise it changes whenever the
   server restarts, and the domain would point at nothing):
   1. In the left menu, under **Network & Security**, click **Elastic IPs**.
   2. Click **Allocate Elastic IP address**, then **Allocate**.
   3. Tick the new address, choose **Actions**, then **Associate Elastic IP address**.
   4. Pick your instance and click **Associate**.
   5. Write the address down (for example `3.120.45.67`). Steps 3 and 4 use it.

## 2. Open the ports (AWS security group)

1. On the instance's page, click the **Security** tab in the lower half. Under **Security groups**,
   click the blue `sg-…` link.
2. On the **Inbound rules** tab, click **Edit inbound rules**.
3. Make sure these three rules are there. Use **Add rule** for any that are missing:

   | Type | Port range | Source |
   |---|---|---|
   | SSH | 22 | Anywhere-IPv4 (`0.0.0.0/0`) |
   | HTTP | 80 | Anywhere-IPv4 (`0.0.0.0/0`) |
   | HTTPS | 443 | Anywhere-IPv4 (`0.0.0.0/0`) |

4. Click **Save rules**.

Port 22 is how GitHub's deploy logs in. GitHub's computers change addresses all the time, so it
can't be narrowed down to just GitHub, but nobody gets in without your `.pem` key: Ubuntu servers on
AWS don't accept passwords. Ports 80 and 443 are the website; Caddy also needs port 80 to get the
HTTPS certificate.

## 3. Point sarahcrossing.com at the server (DNS)

Where you bought the domain (Namecheap: **Domain List**, then **Manage** next to sarahcrossing.com,
then the **Advanced DNS** tab):

1. Delete the records the registrar put there for its parking page: usually a **CNAME Record** for
   `www` and a **URL Redirect Record** for `@`.
2. Add two **A Records**:

   | Type | Host | Value | TTL |
   |---|---|---|---|
   | A Record | `@` | your Elastic IP | Automatic |
   | A Record | `www` | your Elastic IP | Automatic |

3. Make sure there's **no AAAA record** (Let's Encrypt would check that address first).
4. Save. It usually works within minutes, but can take up to an hour.

## 4. Give GitHub the key and the password

1. Open <https://github.com/Davidjdavid/SarahCrossing> and click the **Settings** tab.
2. In the left menu, open **Secrets and variables**, then click **Actions**.
3. Click **New repository secret** and add these, one at a time. Type the **Name** exactly as shown,
   fill in the **Secret** box, then click **Add secret**.

   | Name | Secret |
   |---|---|
   | `EC2_HOST` | The Elastic IP from step 1 (for example `3.120.45.67`). |
   | `EC2_USER` | `ubuntu` |
   | `EC2_SSH_KEY` | The whole contents of the server's `.pem` key file. See below. |
   | `SITE_PASSWORD` | The password Sarah (and you) will type to get onto the island. |

   **Copying the key:**
   1. Find the `.pem` file AWS gave you when you made the key pair. It's often in **Downloads**.
   2. Right-click it, choose **Open with**, then **Notepad**.
   3. Press **Ctrl+A**, then **Ctrl+C**, and paste it into the **Secret** box with **Ctrl+V**.
   4. Check that it starts with `-----BEGIN` and ends with `KEY-----`, then click **Add secret**.
   5. Close Notepad without saving.

> **Never paste the key anywhere else:** not in a chat (including with Claude), an email, an issue,
> or a file in the repository. This secrets page is the only place it goes. The repository is
> public, which is why the password is a secret too and not in a file.

## 5. The first deploy

1. In the repository, click the **Actions** tab. If GitHub asks, enable workflows.
2. On the left, click **Deploy**. On the right, open **Run workflow**, pick the branch
   (`claude/serene-mendel-8428vr`, or `main` once it exists) and click **Run workflow**.
3. Click the run to watch it. The first one takes about 6 minutes (it installs Node.js and Caddy on
   the server); later ones about 4.
4. A **green tick** means it's live. Open <https://sarahcrossing.com>, type the password, and the
   title screen appears. A **red cross**: see [Troubleshooting](#troubleshooting).

## The beta site

Add one more DNS record, like the two in step 3: **A Record**, Host `beta`, Value your Elastic IP.

- **To try a change:** it's on https://beta.sarahcrossing.com a few minutes after the push.
- **To try it on the real islands:** **Actions > Deploy > Run workflow**, pick **beta** and tick
  **copy live islands to beta**. Beta's islands are replaced with a copy of the live ones (Sarah's
  island included); the live site isn't touched, and nothing played on beta goes back to it.
- **When it's good:** **Actions > Deploy > Run workflow**, pick the branch and **live**. That
  version goes to sarahcrossing.com.

## 6. Bring in Sarah's island

In the **old** one-page Sarah Crossing, get the island out either way:

- **A save file:** open the phone, **Save & quit**, then **Just save a file**.
- **A save code:** open the phone, **Settings**, then **Make save code** (it's copied for you).

Then at https://sarahcrossing.com, on the title screen, click **Import a save** and choose the file
(or paste the code) and **Import this code**. The island appears and **Continue** carries on from
there, with everything: house, friends, collection, handmade pottery, money.

Importing the same island again later (say Sarah played the old one a bit more) asks whether to
replace it (the one online is kept as a backup) or keep both.

**On a phone:** open https://sarahcrossing.com in Safari, tap **Share**, then **Add to Home
Screen**. It gets Sarah's icon and opens full screen, like an app. (Android/Chrome: menu, then
**Add to Home screen**.)

---

## Using it

- **Islands** (title screen, or Phone > Settings > Your islands): every island on the server. Play
  another one, start a new one, save one as a file, look at its backups and put one back, or delete
  one (it stays in the server's trash for 30 days).
- **Two devices:** if the island was played on another device after this one opened it, the game
  says so and asks which to keep. The other one goes into the island's backups either way.
- **No connection:** the game keeps saving on the device and sends it once it's back (even if the
  page was closed in between).
- **Save & quit > Just save a file** still works, as an extra backup you keep yourself.

## Changing the password

GitHub, **Settings > Secrets and variables > Actions**, click the pencil next to `SITE_PASSWORD`,
save, then run **Actions > Deploy > Run workflow**. Everyone types the new one once.

## On the server

**A terminal on the server:** in AWS, **EC2 > Instances**, tick the server, **Connect**, the **EC2
Instance Connect** tab, username `ubuntu`, **Connect**. Or from PowerShell:
`ssh -i "C:\Users\<you>\Downloads\<your-key>.pem" ubuntu@sarahcrossing.com`

```
/srv/sarahcrossing/       the live site (the beta site is the same, in /srv/sarahcrossing-beta,
                          service sarahcrossing-beta, port 8091)
  current ->            the live release
  releases/<version>/   the newest 5 releases (dist/ is the game, server/ the game server)
  password              the password (from the SITE_PASSWORD secret)
  data/
    islands/<id>/island.json      an island (its save is the "state" in it)
    islands/<id>/photos.json      its photo album
    islands/<id>/backups/         its backups, named by the time (UTC) they were made
    trash/                        deleted islands, kept 30 days
    secret                        signs the "remember the password" cookie
/var/backups/sarahcrossing/       a copy of all of data/ every night, kept 14 days
```

```
sudo systemctl status sarahcrossing          # is it running?
sudo journalctl -u sarahcrossing -f          # live server log (problems in the game show up here too)
sudo journalctl -u caddy -n 50               # HTTPS / certificate problems
```

**Getting a deleted island back** (within 30 days):

```
sudo ls /srv/sarahcrossing/data/trash
sudo mv /srv/sarahcrossing/data/trash/<id>--<time> /srv/sarahcrossing/data/islands/<id>
```

**Going back to an older version of the game:** in **Actions > Deploy**, open an older green run,
then **Re-run jobs**. Or on the server, instantly:

```
ls /srv/sarahcrossing/releases
sudo ln -sfn /srv/sarahcrossing/releases/<version> /srv/sarahcrossing/current && sudo systemctl restart sarahcrossing
```

**A safety copy of the whole server:** **EC2 > Volumes**, tick the server's disk, **Actions >
Create snapshot**. (The nightly copy in `/var/backups` is on the same disk.)

**Sharing the server with another game:** Sarah Crossing uses its own port (8090), user and folders,
and only changes its own lines in `/etc/caddy/Caddyfile` (between `# BEGIN sarahcrossing` and
`# END sarahcrossing`). The Dr Hazelwood and Settlers deploys still rewrite the whole Caddyfile,
so on a shared server each of their deploys would drop this site until the next Sarah Crossing
deploy. A server of its own avoids that.

## Troubleshooting

When a deploy fails after connecting, its last step (**What the server says**) shows whether the
domain points at the server, whether the services run, and their recent logs.

| What you see | What to do |
|---|---|
| "Can't reach the server on port 22" | The server is stopped, or port 22 isn't open (step 2), or `EC2_HOST` is wrong. |
| "The server refused the key" | `EC2_USER` should be `ubuntu`; `EC2_SSH_KEY` must be the whole `.pem` file, of the key pair the instance was made with. |
| `apt-get: command not found` | The server isn't Ubuntu (step 1). |
| "The game was installed, but https://sarahcrossing.com/healthz doesn't answer" | DNS (step 3): the A record must be the Elastic IP, with no AAAA record and no leftover parking records. Ports 80 and 443 must be open (step 2). After fixing DNS, run the deploy again. |
| "Built and tested, but not deployed" | The secrets from step 4 aren't all there yet. |
| The game says "Can't reach the island server" | The connection dropped. It keeps saving on the device and catches up by itself. |
