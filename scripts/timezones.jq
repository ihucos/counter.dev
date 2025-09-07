# Build a slim, sorted list of timezones including aliases.
# Input: Noda Time TZDB JSON
# Output: { ianaVersion, zones: [ { id, currentOffset, canonical?, minutes, displayId, continent } ... ] }

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

def continentOf($id):
  if ($id | test("/")) then ($id | split("/")[0]) else null end;

def aliasScore($a):
  # lower is better
  (continentOf($a)) as $c |
  if ($a | startswith("Etc/")) then 100
  elif $c == "Atlantic" then 0
  elif $c == "Europe" then 1
  elif $c == "America" then 2
  elif $c == "Asia" then 3
  elif $c == "Australia" or $c == "Pacific" then 4
  elif $c == "Africa" then 5
  else 50 end;

def preferredAlias($aliases):
  ($aliases // [])
  | map(select(test("/") and (startswith("Etc/")|not)))
  | sort_by(aliasScore(.))
  | .[0];

def displayIdForCanonical($z):
  # Keep canonical id for canonical entries
  $z.id;

def displayIdForAlias($z; $alias):
  if ($alias | test("/")) then $alias else (preferredAlias($z.aliases) // $z.id) end;

{
  ianaVersion: .ianaVersion,
  zones: (
    (
      [ .zones[] as $z | { id: $z.id, currentOffset: $z.currentOffset, canonical: null, minutes: minutes($z.currentOffset), displayId: displayIdForCanonical($z) } ]
      +
      [ .zones[] as $z | ($z.aliases[]? | { id: ., currentOffset: $z.currentOffset, canonical: $z.id, minutes: minutes($z.currentOffset), displayId: displayIdForAlias($z; .) }) ]
    )
    | map(. + { continent: ( ( ( .displayId // .id ) | (if (test("/")) then split("/")[0] else ( (.canonical // "") | (if (test("/")) then split("/")[0] else null end) ) end) ) ) })
    | sort_by(.minutes, .displayId)
  )
}
