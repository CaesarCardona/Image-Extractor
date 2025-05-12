const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');
const archiver = require('archiver'); // Import archiver

const app = express();
const port = 5000;

// Enable CORS for the frontend running on port 3000
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests only from this origin
}));

// Define the upload and image directories using absolute paths
const uploadDir = path.join(__dirname, 'Go-app/pdfs');
const imageDir = path.join(uploadDir, 'images');
const zipDir = path.join(uploadDir, 'zips'); // Directory to save ZIP files

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(zipDir)) {
  fs.mkdirSync(zipDir, { recursive: true });
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

  // Define the output path for extracted images
  const outputPath = path.join(imageDir, 'image'); // Images will be named 'image-0001', 'image-0002', etc.

  // Run pdfimages command to extract images
  const command = `pdfimages -j "${filePath}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error extracting images:', err);
      return res.status(500).send('Error extracting images.');
    }

    if (stderr) {
      console.error('stderr:', stderr);
    }

    // Get the list of extracted images
    const imageFiles = fs.readdirSync(imageDir).filter(file => file.startsWith('image-'));
    const totalImages = imageFiles.length;

    // Calculate the combined size of all the extracted images
    let combinedImageSize = 0;
    imageFiles.forEach((image) => {
      combinedImageSize += fs.statSync(path.join(imageDir, image)).size;
    });

    // Create a ZIP file containing all the extracted images
    const zipFilePath = path.join(zipDir, `images-${req.file.filename}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', function () {
      console.log(`ZIP file created: ${zipFilePath}`);
    });

    // Catch any errors
    archive.on('error', function (err) {
      console.error('Error creating ZIP file:', err);
      return res.status(500).send('Error creating ZIP file.');
    });

    archive.pipe(output);

    // Append all image files to the archive
    imageFiles.forEach((image) => {
      archive.file(path.join(imageDir, image), { name: image });
    });

    // Finalize the archive
    archive.finalize();

    // Respond with the relevant information back to the frontend, including the ZIP file URL
    const result = {
      pdfSize: fileSize,
      totalImages,
      combinedImageSize,
      imagePaths: imageFiles.map((image) => path.join('/images', image)),  // Serve images via the '/images' route
      zipFilePath: path.join('/zips', `images-${req.file.filename}.zip`) // Path to download the ZIP
    };

    res.json(result);
  });
});

// Serve the extracted images (use relative path to 'Go-app/pdfs/images')
app.use('/images', express.static(path.join(__dirname, 'Go-app/pdfs/images')));

// Serve the ZIP files (use relative path to 'Go-app/pdfs/zips')
app.use('/zips', express.static(path.join(__dirname, 'Go-app/pdfs/zips')));

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

