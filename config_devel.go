package main

func NewConfig() Config{
        return Config{
        Bind: ":80",
        CookieSecret: []byte("dahhh"),
        }
}
