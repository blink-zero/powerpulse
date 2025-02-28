# 🔒 Security Stuff

## Versions We're Looking After

Here are the versions we're currently keeping an eye on and patching:

| Version | Still Getting Love? |
| ------- | ------------------ |
| 1.8.x   | ✅ You bet! |
| 1.7.x   | ✅ Yep! |
| 1.6.x   | ✅ Still caring for these |
| < 1.6   | ❌ Time to upgrade! |

## Found a Security Bug?

Hey, it happens to the best of us! If you've found something that doesn't look right security-wise:

1. **Please don't post it publicly** - let's keep it between us for now
2. **Drop us an email at [INSERT EMAIL]** with:
   - What you found
   - How to make it happen
   - Screenshots or code if you've got them
   - Ideas for fixing it (if you have any)

## What Happens Next

- We'll get back to you within a couple of days to let you know we got your message
- We'll take a look and figure out how serious it is
- We'll keep you in the loop while we fix it
- When it's all patched up, we'll give you a shout-out for finding it (unless you'd rather stay anonymous)

## Tips for Keeping PowerPulse Safe

When you're setting up PowerPulse, here are some easy ways to make it more secure:

1. **Make a Strong Secret Key**
   - Run this to generate a good one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Don't use the default one that comes with the app!

2. **Keep Your .env File Private**
   - Don't commit it to GitHub
   - Don't share it with people who don't need it

3. **Use HTTPS**
   - It's 2025 - everything should be HTTPS!
   - Set `ENABLE_HTTPS=true` in your settings

4. **Take Care of Your Database**
   - Set the right permissions so random people can't read it
   - Back it up now and then (you'll thank yourself later)

5. **Stay Updated**
   - We fix security stuff in new versions
   - Updating is easier than getting hacked!

## Cool Security Features Built In

PowerPulse comes with some nice security features out of the box:

- Login tokens that expire after 24 hours
- Different permission levels for different users
- Auto-logout when you walk away from your computer
- Secure password storage
- Input checking to prevent nasty attacks
- Protection against common web security problems

## Third-Party Packages

We use a bunch of open-source packages to make PowerPulse work. We try to keep them updated, but if you notice something fishy with one of them, let us know and maybe tell the package maintainers too.
