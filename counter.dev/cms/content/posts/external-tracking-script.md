Title: External tracking script
Date: 2022-09-18
Caption: No more inline javascript needed
Author: Irae Hueck Costa
Featured: true

# External tracking script

We do now have an externally hosted tracking script, exactly as other Web
Analytics providers.

## What?

We do now offer a vanilla tracking script, example:

```
<script src="https://cdn.counter.dev/script.js"
  data-id="93671ad4-a966-4a52-b48f-56c92d10a671"
  data-utcoffset="1"
</script>
```

## How to migrate

Go to your dashboard, then click the settings icon. There you have the new
tracking script. You don't want to do that? That is completely fine too and no
major obstruction is expected. You might be missing out on new features though.

Don't forget to delete your old tracking snippet.

## Security

The script is distributed over _GitHub pages_, there is _CloudFlare_ on front of
that. This means there are no hand managed servers holding that script.
