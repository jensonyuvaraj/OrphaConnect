const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware to parse JSON body
app.use(bodyParser.json());

app.use(cors());

const dataFilePath = path.join(__dirname, 'templates', 'data.json');

app.post('/submitForm', (req, res) => {
    const jsonData = req.body;
    console.log('Received JSON data:', jsonData);

    if (jsonData.operation==="append") {
        saveFormData(jsonData.formData);
    } else if (jsonData.operation==="edit") {
        editDataByID(jsonData.formData.id, jsonData.formData);
    } else if (jsonData.operation==="delete") {
        deleteDataByID(jsonData.formData.id);
    } else {
        console.log("invalid operation");
    }
    
    res.json({ message: 'JSON data received and updated successfully' });
});

function saveFormData(formData) {

  fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err && err.code !== 'ENOENT') {
          console.error('Error reading data.json:', err);
          return;
      }

      let jsonDataArray = [];
      if (data) {
          // Parse existing data as JSON
          try {
              jsonDataArray = JSON.parse(data);
          } catch (parseError) {
              console.error('Error parsing existing JSON data:', parseError);
              return;
          }
      }

      const newId = jsonDataArray.length > 0 ? jsonDataArray[jsonDataArray.length - 1].id + 1 : 1;
      formData.id = newId;
      
      jsonDataArray.push(formData);

      // Write updated data back to data.json
      fs.writeFile(dataFilePath, JSON.stringify(jsonDataArray, null, 2), 'utf8', (writeErr) => {
          if (writeErr) {
              console.error('Error writing to data.json:', writeErr);
              return;
          }
          console.log('Form data saved successfully.');
      });
  });
}

function editDataByID(id, newData) {
    // Read the JSON file and parse its contents
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        try {
            // Parse the JSON data
            let jsonData = JSON.parse(data);
            
            const entryToUpdate = jsonData.find(entry => entry.id == id);

            if (!entryToUpdate) {
                console.error('Data with ID', id, 'not found.');
                return;
            }

            Object.assign(entryToUpdate, newData);

            // Write the updated data back to the JSON file
            fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log('Data with ID', id, 'updated successfully.');
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
}

function deleteDataByID(id) {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        try {
            let jsonData = JSON.parse(data);
            
            const dataIndex = jsonData.findIndex(entry => entry.id == id);

            if (dataIndex === -1) {
                console.error('Data with ID', id, 'not found.');
                return;
            }

            jsonData.splice(dataIndex, 1);

            // Write the updated data back to the JSON file
            fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log('Data with ID', id, 'deleted successfully.');
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
