#Scalable URL Shortener Project

This project aims to develop a scalable URL shortener service that generates shorter aliases for long URLs. The shortened aliases, also known as "short links," redirect users to the original URL when accessed. This helps save space, prevents mistyping of long URLs, and provides easy tracking of individual links.
Phase I
Overview

#URL shortening is a common practice used to create shorter and more manageable URLs. In this phase, we will focus on the core functionality of the URL shortener service.

#Models

The project uses a Url model to store the URLs in the database. The model has the following attributes:

    urlCode (mandatory, unique, lowercase, trim): A unique identifier for the shortened URL.
    longUrl (mandatory, valid URL): The original URL.
    shortUrl (mandatory, unique): The shortened URL.

#API Endpoints

    POST /url/shorten
        Creates a short URL for the provided original URL.
        
        Example request body:
        {
          "longUrl": "http://example.com/very-long-url"
        }

        Example response:

        {
          "status": true,
          "data": {
            "longUrl": "http://example.com/very-long-url",
            "shortUrl": "http://localhost:3000/abc123",
            "urlCode": "abc123"
          }
        }

        Returns HTTP status 400 for an invalid request.

    GET /:urlCode
        Redirects to the original URL corresponding to the provided urlCode.
        Returns a suitable error message for a URL not found.
        Returns HTTP status 400 for an invalid request.

#Testing

    Use Postman to test the API endpoints.
    Create a new collection named "Project 2 URL Shortener."
    Add a request to the collection for each API endpoint.
    Ensure that each request is named correctly.

#Phase II

#Caching

In this phase, we introduce caching to optimize the retrieval of newly created short URLs within the first 24 hours.

    Implement caching logic to store and retrieve the long URLs associated with the short URLs.
    Use caching to minimize database calls while fetching the shortened URLs.

#Dependencies

The project uses the following dependencies:

    ->dotenv: Loads environment variables from a .env file.
    ->shortid: Generates unique short IDs for the URL codes.
    ->valid-url: Validates the format of the original URLs.
    ->redis: A caching solution for storing and retrieving data.

Make sure to install these dependencies by running npm install before running the project.
Setup Instructions

    Clone the project repository.
    Install the required dependencies using npm install.
    Configure the environment variables by creating a .env file.
    Start the server using npm start.

Please refer to the documentation for detailed instructions on environment variable configuration, running the server, and API usage.

#Conclusion

The Scalable URL Shortener Project provides a robust and scalable solution for shortening and managing URLs. By implementing caching and optimizing database calls, the project ensures efficient performance even under high traffic scenarios.