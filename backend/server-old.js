const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS for the frontend running on port 3000
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests only from this origin
}));

// Define the upload and image directories using absolute paths
const uploadDir = path.join(__dirname, 'Go-app/pdfs');
const imageDir = path.join(uploadDir, 'images');

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Set up file upload handling using multer
const upload = multer({ dest: uploadDir }); // Files will be uploaded to 'Go-app/pdfs'

// Endpoint to handle PDF upload
app.post('/Go-app/pdfs', upload.single('file'), (req, res) => {
  // Check if file is uploaded
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Log the file details and upload path
  console.log('File uploaded successfully:', req.file);
  console.log('Stored at:', req.file.path);

  // Get the uploaded file details
  const filePath = req.file.path;
  const fileSize = req.file.size;

  // Extract the file name from the path (this will help for Docker command)
  const fileName = path.basename(filePath);
  console.log('Extracted File Name:', fileName);

  // Trigger Docker command to extract images from the uploaded PDF
  const dockerCommand = `
    sudo docker run -it --mount type=bind,source="$(pwd)",target=/app pdfcpu extract -mode=image ./pdfs/${fileName} ./pdfs/images
  `;

  // Execute the Docker command
  exec(dockerCommand, { shell: '/bin/bash' }, (err, stdout, stderr) => {
    if (err) {
      console.error('Error executing Docker command:', err);
      return res.status(500).send('Error executing Docker command.');
    }

    console.log('Docker command stdout:', stdout);
    console.error('Docker command stderr:', stderr);

    // Assuming images are extracted to the 'images/' folder by the script
    const imageFiles = fs.readdirSync(imageDir);
    const totalImages = imageFiles.length;

    // Calculate the combined size of all the extracted images
    let combinedImageSize = 0;
    imageFiles.forEach((image) => {
      combinedImageSize += fs.statSync(path.join(imageDir, image)).size;
    });

    // Respond with the relevant information back to the frontend
    const result = {
      pdfSize: fileSize,
      totalImages,
      combinedImageSize,
      imagePaths: imageFiles.map((image) => path.join('/images', image))  // Serve images via the '/images' route
    };

    res.json(result);
  });
});

// Serve the extracted images (use relative path to 'Go-app/pdfs/images')
app.use('/images', express.static(path.join(__dirname, 'Go-app/pdfs/images')));

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

