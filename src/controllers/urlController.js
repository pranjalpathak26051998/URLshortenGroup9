const urlModel = require("../models/urlModel")
const validUrl = require('valid-url');
const shortid = require('shortid');

const urlShortner = async function (req, res) {
    try {
        const { longUrl } = req.body;
        if (!validUrl.isWebUri(longUrl)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }
        // Check if the URL already exists in the database
        let url = await urlModel.findOne({ longUrl: longUrl });

        if (url) {
            // URL already exists, return the existing short URL
            return res.json({ shortUrl: url.shortUrl });
        }
        const baseUrl = 'http://localhost:3000'; // Replace with your application's base URL
        const urlCode = shortid.generate(longUrl);
        const shortUrl = `${baseUrl}/${urlCode}`;

        // Create a new URL document and save it to the database
        urlSave = await urlModel.create({
            urlCode,
            longUrl,
            shortUrl,
          });
          
        res.status(201).send({ status: true, data: urlSave })
 
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
const getUrl = async function (req, res) {
    try {
        const { urlCode } = req.params;
        console.log(urlCode)

        // Find the URL document in the database
        const url = await urlModel.findOne({ urlCode: urlCode });
        // console.log(url)

        if (url) {
            // Redirect to the original URL
            return res.redirect(url.longUrl);
        } else {
            // URL not found in the database
            return res.status(404).send({ error: 'URL not found' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: 'Server Error' });
    }
}
module.exports.urlShortner = urlShortner
module.exports.getUrl = getUrl