# Simple Web Analytics (SWA)

Shows how many people visit your web application.

## Check out the demo
[https://simple-web-analytics.com/#demo](https://simple-web-analytics.com/#demo)

## Technology
Simple Web Analytics is a small Go server and static assets. Everyting is saved to Redis.

## Simplicity
This project tries to be a Script rather than an Application.

## Performance
This project aim is to serve many users for free in a sustainable way.

## How can it be Free?

* While most analytics solutions track users individually, assigning an user id via Cookies or fingerprinting techniques, Simple Web Analytics collects only aggregated data. This requires cheaper database queries and considerably less data is saved to the database.

* Counting unique users is achieved with a combination of relying on `sessionStorage` facilities, the browser's cache mechanism and inspecting the referrer. Using this technique considerably reduces the complexity and load on the server while improving data privacy at the cost of knowing less about users. We can't and don't want to be able to connect single page views to an user identity.

* Usually web analytics solutions track every page loaded. We only track the first page the user views, this is again more privacy friendly and additionally also results in substantial less HTTP requests the server has to handle. As a result of this strategy, Simple Web Analytics is able to show top landing pages but not top pages.

* Our infrastructure is designed for high load with a static binary to handle the HTTP requests (Golang) and an in memory database that is regularly backed up to disk (Redis). This is much more economical than a typical relational database accessed by a scripting language.

* Web Applications nowadays typically make use of platform as a service providers for hosting. Substantial more performance for the same amount of money can be gained by renting dedicated or virtual servers. This is what Simple Web Analytics does at the price of having to manage everything "by hand" and developing strategies to still reduce needed maintenance efforts.

* While most other analytics Solutions provide the tracking script as an externally hosted file, we use a small inline tracking script. Doing so mitigates the need to host and serve such a script and avoids any otherwise necessary efforts to secure such an externally hosted script, which would have to be trusted by all our users.

* Summing up, collecting less the right way considerably decreases hosting expenses in comparison to typical other solutions and is more privacy friendly.



## AGPL Licensed
Simple Web Analytics is Open Source for transparency reasons. Although self
hosting may be possible with some tinkering.
