const urlModel = require("../models/urlModel");
require('dotenv').config();
const validUrl = require('valid-url');
const validator = require('validator');
const shortid = require('shortid');
const { isValid } = require("../utils/validation");
const redis = require('redis');
const { promisify } = require("util");

const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST,
  { no_ready_check: true }
);
redisClient.auth(process.env.REDIS_PASSWORD, function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const urlShortner = async function (req, res) {
  try {
    let { longUrl } = req.body;

    if(Object.keys(req.body).length == 0) {
      return res.status(400).send({status : false , message : "pls enter url"})
    }

    if (!longUrl) {
      return res.status(400).send({ status: false, message: "Request body must contain longUrl" });
    }
    
    if (!isValid(longUrl)) {
      return res.status(400).send({ status: false, message: "longUrl must be a Valid URL" });
    }

    longUrl = longUrl.trim();

    if (!validUrl.isWebUri(longUrl)) {
      return res.status(400).send({ status: false, message: "longUrl must be a Valid URL" });
    }

    if(!validator.isURL(longUrl)){
      return res.status(400).send({ status: false, message: "Url Domain not Allowed" });
    }

    // Check if the URL already exists in the cache
    let cacheUrl = await GET_ASYNC(`${longUrl}`);

    if (cacheUrl) {
      const cacheData = JSON.parse(cacheUrl);
      return res.status(200).send({ status: true, data: {longUrl:cacheData.longUrl, shortUrl:cacheData.shortUrl, urlCode:cacheData.urlCode}});
    }

    // Check if the URL already exists in the database
    let urlData = await urlModel.findOne({ longUrl: longUrl }).select({longUrl:1, shortUrl:1, urlCode:1 ,_id :0});

    if (urlData) {
      // Cache the URL for 24 hours
      await SET_ASYNC(`${longUrl}`, JSON.stringify(urlData), 'EX', 24 * 60 * 60);

      return res.status(200).send({ status: true, data: {longUrl:urlData.longUrl, shortUrl:urlData.shortUrl, urlCode:urlData.urlCode}});
    }

    const baseUrl = process.env.BASE_URL // Replace with your application's base URL
    const urlCode = shortid.generate();
    const shortUrl = `${baseUrl}/${urlCode}`;

    // Create a new URL document and save it to the database
    urlDB = await urlModel.create({
      longUrl,
      shortUrl,
      urlCode
    });

    let urlResponse = {
      longUrl : urlDB.longUrl,
      shortUrl: urlDB.shortUrl,
      urlCode : urlDB.urlCode
  }

    // Cache the URL for 24 hours
    await SET_ASYNC(`${longUrl}`, JSON.stringify({longUrl,shortUrl,urlCode}), 'EX', 24 * 60 * 60);

    res.status(201).send({ status: true, data: urlResponse });
  } 
  catch (error) {
    console.error(error);
    return res.status(500).send({  status: false, message: "Internal Server Error" });
  }
};

const getUrl = async function (req, res) {
  try {

    let { urlCode } = req.params;

    if (!urlCode) {
      return res.status(400).send({ status: false, message: "urlCode is required" });
    }

    urlCode = urlCode.trim().toLowerCase();
    
    // URL convert using the trimmed and lowercase URL code
    
    // Check if the URL exists in the cache
    let cachedUrl = await GET_ASYNC(`${urlCode}`);

    if (cachedUrl) {
      const { longUrl } = JSON.parse(cachedUrl);
      // Redirect to the original URL
      return res.status(302).redirect(longUrl);
    }
    // Find the URL document in the database
    const urlData = await urlModel.findOne({ urlCode: urlCode });

    if (urlData) {
      // Cache the URL for 24 hours
      await SET_ASYNC(`${urlCode}`, JSON.stringify({ longUrl: urlData.longUrl }), 'EX', 24 * 60 * 60);
      // Redirect to the original URL
      return res.status(302).redirect(urlData.longUrl);
    } 
    else {
      // URL not found in the cache or database
      return res.status(404).send({status: false, message: "URL not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: false, message: "Internal Server Error" });
  }
};

module.exports.urlShortner = urlShortner;
module.exports.getUrl = getUrl;