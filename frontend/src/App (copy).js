import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);

  function handleChange(event) {
    setFile(event.target.files[0]);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const url = 'http://localhost:5000/Go-app/pdfs'; // Backend URL
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    axios
      .post(url, formData, config)
      .then((response) => {
        console.log('File uploaded successfully:', response.data);
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
      });
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <h1>React File Upload</h1>
        <input type="file" onChange={handleChange} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default App;

