# Integration Guide for Tracking Script

## Introduction

The Javascript tracking script is a provided by our service to track user
interactions with your website. This guide will explain how to integrate the
tracking script into your website.

## Pre-requisites

Before you start the integration process, please make sure of the following:

- Disable any tracking blocker that may be installed in your browser. This is
  necessary to ensure that the tracking script will function properly.
- Ensure that the tracking script is included in the HTML code of your website.
  You can check this by inspecting the source code of your webpage.

## Integration Process

To integrate the tracking script into your website, follow these steps:

1. Log in to your account and copy the tracking code.
2. Paste the tracking code just before the closing `</head>` tag in the HTML
   code of your website.
3. Save the changes to your website.

Once you have completed the above steps, the tracking script will start
working.

## Tracking Script Configuration

The tracking script supports two methods for timezone configuration:

### Recommended: IANA Timezone (Preferred)

```html
<script src="https://cdn.counter.dev/script.js"
  data-id="YOUR-UUID-HERE"
  data-timezone="America/New_York">
</script>
```

**Benefits:**
- Automatically handles Daylight Saving Time (DST) transitions
- More accurate time zone representation
- Supports fractional offsets (e.g., India +5:30, Nepal +5:45)

**Common timezone examples:**
- `America/New_York` (US Eastern Time)
- `America/Los_Angeles` (US Pacific Time)
- `Europe/London` (UK)
- `Europe/Berlin` (Central European Time)
- `Asia/Tokyo` (Japan Standard Time)
- `Australia/Sydney` (Australian Eastern Time)

### Legacy: UTC Offset (Still Supported)

```html
<script src="https://cdn.counter.dev/script.js"
  data-id="YOUR-UUID-HERE"
  data-utcoffset="1">
</script>
```

**Note:** UTC offset does not handle DST transitions automatically. We recommend migrating to the timezone parameter for better accuracy.

## Migration from UTC Offset to Timezone

If you're currently using `data-utcoffset`, we recommend upgrading to `data-timezone`:

### Step 1: Find Your IANA Timezone

Common conversions:
- **UTC-8** → `America/Los_Angeles` (US Pacific)
- **UTC-7** → `America/Denver` (US Mountain)
- **UTC-6** → `America/Chicago` (US Central)
- **UTC-5** → `America/New_York` (US Eastern)
- **UTC-4** → `America/Halifax` (Atlantic)
- **UTC+0** → `Europe/London` (UK)
- **UTC+1** → `Europe/Berlin` (Central Europe)
- **UTC+2** → `Europe/Helsinki` (Eastern Europe)
- **UTC+8** → `Asia/Shanghai` (China)
- **UTC+9** → `Asia/Tokyo` (Japan)
- **UTC+10** → `Australia/Sydney` (Australia Eastern)

### Step 2: Update Your Script

Replace:
```html
<script src="https://cdn.counter.dev/script.js"
  data-id="YOUR-UUID"
  data-utcoffset="1">
</script>
```

With:
```html
<script src="https://cdn.counter.dev/script.js"
  data-id="YOUR-UUID"
  data-timezone="Europe/Berlin">
</script>
```

### Benefits of Migration

- **Automatic DST handling**: No more manual updates twice a year
- **Accurate fractional offsets**: Support for timezones like India (+5:30)
- **Future-proof**: Uses industry standard IANA timezone database

## Troubleshooting

If you encounter any problems during the integration process, please contact
our support team for assistance. Some common issues that you may encounter
include:

- The tracking script is not properly installed in your website.
- The tracking script is being blocked by a browser extension or other
  software.
- There is a conflict with other Javascript code on your website.
- Your browser is blocking the tracking script, try with a different one.

By following the steps outlined in this guide and contacting our support team
when necessary, you should be able to successfully integrate the Javascript
tracking script into your website.
