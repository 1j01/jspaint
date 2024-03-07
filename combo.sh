#!/bin/bash

# Define the alphabet
# alphabet=(a b c d e f g h i j k l m n o p q r s t u v w x y z)
alphabet=(a b m)

# Function to generate combinations
generate_combinations() {
    local prefix=$1
    local length=$2

    if [ $length -eq 0 ]; then
		echo $prefix
        ./node_modules/electron/dist/electron.exe . $prefix > /dev/null 2>&1
    else
        for letter in "${alphabet[@]}"; do
            generate_combinations $prefix$letter $(($length - 1))
        done
    fi
}

# Set the maximum length of combinations you want
max_length=5

# Generate combinations up to the maximum length
for ((i=1; i<=$max_length; i++)); do
    generate_combinations "" $i
done