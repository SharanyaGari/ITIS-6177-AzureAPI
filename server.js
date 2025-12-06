require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');

const app = express();
const upload = multer(); // parse multipart/form-data

// Increase payload limit for large images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route to analyze image (URL or file)
app.post('/api/image/analyze', upload.single('image'), async (req, res) => {
    try {
        const endpoint = process.env.AZURE_ENDPOINT;
        const apiKey = process.env.AZURE_API_KEY;

        if (!endpoint || !apiKey) {
            return res.status(500).json({ error: "Azure credentials not set in environment variables" });
        }

        const url = `${endpoint}computervision/imageanalysis:analyze?features=caption,objects,tags,read&model-version=latest&language=en&api-version=2024-02-01`;

        // -----------------------------------------
        // 1) If Image URL was provided
        // -----------------------------------------
        if (req.body.imageUrl) {
            console.log("Sending to Azure (URL):", req.body.imageUrl);

            const response = await axios.post(
                url,
                { url: req.body.imageUrl },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': apiKey
                    }
                }
            );

            return res.json(response.data);
        }

        // -----------------------------------------
        // 2) If local image file was uploaded
        // -----------------------------------------
        if (req.file) {
            console.log("Sending to Azure (file), size:", req.file.size);

            const response = await axios.post(
                url,
                req.file.buffer, // send BINARY
                {
                    headers: {
                        'Content-Type': req.file.mimetype, // image/jpeg, image/png
                        'Ocp-Apim-Subscription-Key': apiKey
                    }
                }
            );

            return res.json(response.data);
        }

        return res.status(400).json({ error: "Please provide imageUrl or upload a file" });

    } catch (error) {
        console.error(
            "Azure Error:",
            error.response ? error.response.data : error.message
        );

        return res.status(500).json({
            error: "Failed to analyze image",
            details: error.response ? error.response.data : error.message
        });
    }
});

// Use 0.0.0.0 so external requests can reach the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
