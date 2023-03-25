[![Awesome Humane Tech](https://raw.githubusercontent.com/humanetech-community/awesome-humane-tech/main/humane-tech-badge.svg?sanitize=true)](https://github.com/humanetech-community/awesome-humane-tech)

# Counter

Shows how many people visit your web application.

[counter.dev](https://counter.dev)

## Check out the demo

[Open demo](https://counter.dev/app#demo)

## Technology

Counter is a small Go server and static assets. Everything is saved to Redis.

## Performance

This project aim is to serve many users for free in a sustainable way.

## How can it be free?

- While most analytics solutions track users individually, assigning a user id via cookies or fingerprinting techniques, Counter collects only aggregated data. This requires cheaper database queries and considerably less data is saved to the database.

- Counting unique users is achieved with a combination of relying on `sessionStorage` facilities, the browser's cache mechanism and inspecting the referrer. Using this technique considerably reduces the complexity and load on the server while improving data privacy at the cost of knowing less about users. We can't and don't want to be able to connect single page views to a user identity.

- ~~Usually web analytics solutions track every page loaded. We only track the first page the user views, this is again more privacy-friendly and additionally also results in substantial less HTTP requests the server has to handle. As a result of this strategy, Counter is able to show top landing pages but not top pages.~~

- Our infrastructure is designed for high load with a static binary to handle the HTTP requests (Golang) and an in memory database that is regularly backed up to disk (Redis). This is much more economical than a typical relational database accessed by a scripting language.

- Web applications nowadays typically make use of platform as a service providers for hosting. Substantially more performance for the same amount of money can be gained by renting dedicated or virtual servers. This is what Counter does at the price of having to manage everything "by hand" and developing strategies to reduce needed maintenance efforts.

- ~~While most other analytics solutions provide the tracking script as an externally hosted file, we use a small inline tracking script. Doing so mitigates the need to host and serve such a script and avoids any otherwise necessary efforts to secure such an externally hosted script, which would have to be trusted by all our users.~~

- Summing up, collecting less the right way considerably decreases hosting expenses in comparison to typical other solutions and is more privacy-friendly.

### Real world validation

As documented in [this issue](https://github.com/ihucos/counter.dev/issues/114) real world resource usage to serve millions of unique visits per month is roughly at 25% on a small VPS that costs 5$ per month. As the service has a few hundert active users, every user causes non-fixed costs (There is still the Domain + a extra VPS backup service) of about one cent per month. I am getting these costs covered via donations. But please donate to appreciate efforts for maintenance, further development and ongoing customer service.

## Running locally

In order to run counter locally for development purposes, run:

```
make devserver
```

You will need a redis server at localhost and default port.

## What about self hosting?

Working on an easy way to do it: https://github.com/ihucos/counter.dev-selfhosted


## Developing the blog

The blog is based on [pelican](https://blog.getpelican.com/). The templates are in the `templates/blog` directory. Articles in the `posts` directory. To autogenerate the blog to the folder `static/blog` run `make blog`. The blog is autogenerated at every deploy.

## FAQ

### Can I avoid the cookie banner when using counter.dev?

~~[Probably, but not proven](https://github.com/ihucos/counter.dev/issues/71)~~ [Ongoing discussion](https://github.com/ihucos/counter.dev/issues/71)


## Contributors

- Ana Maria Sandoval Jimenez - Data Scientist
- Irae Hueck Costa ([ihucos](https://github.com/ihucos/)) - Backend Developer

## AGPL Licensed

Counter is Open Source for transparency reasons. Although self
hosting may be possible with some tinkering.
