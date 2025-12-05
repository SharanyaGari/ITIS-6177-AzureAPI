require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');

const app = express();
const upload = multer(); // parse multipart/form-data

app.use(express.json());

// Route to analyze image (URL or file)
app.post('/api/image/analyze', upload.single('image'), async (req, res) => {
    try {
        const endpoint = process.env.AZURE_ENDPOINT;
        const apiKey = process.env.AZURE_API_KEY;

        const url = `${endpoint}computervision/imageanalysis:analyze?features=caption,objects,tags,read&model-version=latest&language=en&api-version=2024-02-01`;

        // -----------------------------------------
        // 1) If Image URL was provided
        // -----------------------------------------
        if (req.body.imageUrl) {
            const response = await axios.post(
                url,
                { url: req.body.imageUrl },  // Correct JSON format
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
            const response = await axios.post(
                url,
                req.file.buffer,  // ⬅️ IMPORTANT: send BINARY, not base64
                {
                    headers: {
                        'Content-Type': req.file.mimetype, // image/jpeg, image/png
                        'Ocp-Apim-Subscription-Key': apiKey
                    }
                }
            );

            return res.json(response.data);
        }

        return res
            .status(400)
            .json({ error: "Please provide imageUrl or upload a file" });

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
