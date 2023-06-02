const urlModel = require("../models/urlModel");
const validUrl = require('valid-url');
const shortid = require('shortid');
const { isValid } = require("../utils/validation");
const redis = require('redis');
const { promisify } = require("util");

const redisClient = redis.createClient(
  10006,
  "redis-10006.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("G7a7d9ZeQxqwBIeUSjcwqpphKQjWCS5K", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const urlShortner = async function (req, res) {
  try {
    const { longUrl } = req.body;
    if (!isValid(longUrl)) {
      return res.status(400).send({ status: false, message: "longUrl must be a string" });
    }
    if (!validUrl.isWebUri(longUrl)) {
      return res.status(400).send({ error: 'Invalid URL' });
    }

    // Check if the URL already exists in the cache
    let cacheUrl = await GET_ASYNC(longUrl);
    if (cacheUrl) {
      const { shortUrl } = JSON.parse(cacheUrl);
      return res.status(200).send({ status: true, message: "Already available", shortUrl });
    }

    // Check if the URL already exists in the database
    let url = await urlModel.findOne({ longUrl: longUrl });
    if (url) {
      // Cache the URL for 24 hours
      await SET_ASYNC(longUrl, JSON.stringify({ urlCode: url.urlCode, shortUrl: url.shortUrl }), 'EX', 24 * 60 * 60);
      return res.status(200).send({ status: true, message: "Already available", shortUrl: url.shortUrl });
    }

    const baseUrl = 'http://localhost:3000'; // Replace with your application's base URL
    const urlCode = shortid.generate(longUrl);
    const shortUrl = `${baseUrl}/${urlCode}`;

    // Create a new URL document and save it to the database
    url = await urlModel.create({
      urlCode,
      longUrl,
      shortUrl,
    });

    // Cache the URL for 24 hours
    await SET_ASYNC(longUrl, JSON.stringify({ urlCode, shortUrl }), 'EX', 24 * 60 * 60);

    res.status(201).send({ status: true, data: url });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getUrl = async function (req, res) {
  try {
    const { urlCode } = req.params;

    // Check if the URL exists in the cache
    let cachedUrl = await GET_ASYNC(urlCode);
    if (cachedUrl) {
      const { longUrl } = JSON.parse(cachedUrl);
      // Redirect to the original URL
      return res.redirect(longUrl);
    }

    // Find the URL document in the database
    const url = await urlModel.findOne({ urlCode: urlCode });

    if (url) {
      // Cache the URL for 24 hours
      await SET_ASYNC(urlCode, JSON.stringify({ longUrl: url.longUrl }), 'EX', 24 * 60 * 60);
      // Redirect to the original URL
      return res.redirect(url.longUrl);
    } else {
      // URL not found in the cache or database
      return res.status(404).send({ error: 'URL not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Server Error' });
  }
};

module.exports.urlShortner = urlShortner;
module.exports.getUrl = getUrl;
