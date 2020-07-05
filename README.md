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

* While most Analytics solution put effort into tracking users one by one assigning them an user id via Cookies or fingerprinting techniques, Simple Web Analytics only collects aggregated data. This requires cheaper database queries and considerably less data is saved to the database.

* Counting unique users is achieved with a combination of relying on `sessionStorage` facilities and the cache mechanism of the user's browser. Using this technique considerably reduces the complexity and load on the server while improving data privacy at the cost of knowing less about users. We can't and don't want to be able to connect single page views to an user identity.

* Usually Web Analytics solutions track every page loaded. We only track the first page the user views, this is again more privacy friendly and additionally also results in substantial less HTTP requests the server has to handle. As a result of this strategy Simple Web Analytics is able to show all top landing pages but not top pages.

* Our infrastructure is designed for high load with a static binary to handle the HTTP requests (Golang) and an in memory database that is regularly backed up to disk (Redis). This is much more economical than a typical relational database accessed by a scripting language.

* Typical web applications nowadays make use of platform as a service providers for hosting. Substantial more performance for the same amount of money can be gained by renting dedicated or virtual servers. This is what Simple Web Analytics does at the price of having to manage everything "by hand" and developing strategies to cope with such a service.

* While most other Analytics Solutions provide tracking script as an external file that can be included in the HTML of the page, we use an inline tracking script (couple of lines) for that. While slightly less handy, doing so mitigates the need to host and serve such a script and mitigates any otherwise necessary efforts into making such a script - that would have to be trusted by all our users - sufficiently secure.

* All in All Simple Web Analytics trades Privacy for simpler metrics, that are carefully weighted to be exactly what is needed for most use cases. Collecting less the right way considerably decreases hosting expenses in comparison to typical other solutions.



## AGPL Licensed
Simple Web Analytics is Open Source for transparency reasons. Although self
hosting may be possible with some tinkering.
