package main

func NewConfig() Config{
        return Config{
        bind: ":80",
        cookieSecret: "dahhh",
        }
}
