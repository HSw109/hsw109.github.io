#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 filename"
    echo "Example: $0 Screenshot.png"
    exit 1
fi

source_dir="/mnt/c/Users/truon/Pictures/Screenshots"
mv "$source_dir/$1" .

if [ $? -eq 0 ]; then
    echo "Successfully moved $1 to current directory"
else
    echo "Error: Failed to move file"
fi
