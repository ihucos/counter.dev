# Build a slim, sorted list of timezones including aliases.
# Input: Noda Time TZDB JSON
# Output: { ianaVersion, zones: [ { id, currentOffset, canonical?, minutes } ... ] }

def token($s):
  ($s // "") | split(" ")[0];

def minutes($s):
  (token($s)) as $t
  | if ($t | length) == 0 then 0
    else
      ( $t | capture("^(?<sign>[+-])(?<hh>\\d{2})(?::?(?<mm>\\d{2}))?$") ) as $m
      | (if $m.sign == "-" then -1 else 1 end)
        * ((($m.hh|tonumber) * 60) + ((($m.mm // "0")|tonumber)))
    end;

{
  ianaVersion: .ianaVersion,
  zones: (
    (
      [ .zones[] as $z | { id: $z.id, currentOffset: $z.currentOffset, canonical: null, minutes: minutes($z.currentOffset) } ]
      +
      [ .zones[] as $z | ($z.aliases[]? | { id: ., currentOffset: $z.currentOffset, canonical: $z.id, minutes: minutes($z.currentOffset) }) ]
    )
    | sort_by(.minutes, .id)
  )
}
