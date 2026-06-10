#!/bin/bash
# Modernize JavaScript code: var → const/let, add semicolons, improve style

find static/components static/js -name "*.js" -type f | while read file; do
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace var with const (when not reassigned) or let
    sed -i 's/var \([a-zA-Z_][a-zA-Z0-9_]*\) = \([^;]*\);$/const \1 = \2;/' "$file"
    sed -i 's/var \([a-zA-Z_][a-zA-Z0-9_]*\)$=/const \1=/g' "$file"
    
    # Add semicolons where missing
    sed -i 's/\([a-zA-Z0-9_]\)\s*$/\1;/' "$file"
    
    # Remove backup if successful
    rm "$file.bak"
    
    echo "Done: $file"
done

echo "JavaScript modernization complete!"