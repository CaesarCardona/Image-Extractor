import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [zipFileLink, setZipFileLink] = useState('');
  const [isLoading, setIsLoading] = useState(false); // To show loading state

  // Handle file input change
  function handleChange(event) {
    setFile(event.target.files[0]);
  }

  // Handle form submission for file upload
  function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      alert('Please select a file to upload!');
      return;
    }

    const url = 'http://localhost:5000/Go-app/pdfs'; // Backend URL
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    setIsLoading(true); // Set loading state to true while uploading

    axios
      .post(url, formData, config)
      .then((response) => {
        console.log('File uploaded successfully:', response.data);
        setIsLoading(false); // Set loading state to false once the upload is complete
        const { zipFilePath } = response.data;
        setZipFileLink(zipFilePath); // Set the zip file download link
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        setIsLoading(false); // Set loading state to false in case of an error
      });
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <h1>React PDF to Images Upload</h1>
        <input type="file" onChange={handleChange} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {zipFileLink && (
        <div>
          <h2>Download Images</h2>
          <a href={zipFileLink} download>
            Click here to download the images as ZIP
          </a>
        </div>
      )}
    </div>
  );
}

export default App;

