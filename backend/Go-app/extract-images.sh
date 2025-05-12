#!/bin/bash

# extract_images.sh
# This script runs the Docker command to extract images from a PDF

# Arguments passed to the script
PDF_FILE=$1
IMAGE_OUTPUT_DIR=$2

# Run the docker command to extract images

sudo docker run -it --mount type=bind,source="/home/user/Documents/React-go-app/backend/Go-app",target=/app pdfcpu extract -mode=image ./pdfs/a.pdf ./pdfs/images

