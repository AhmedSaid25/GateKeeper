# GateKeeper Service

GateKeeper is a standalone rate limiting service designed to manage and enforce rate limits for clients based on their unique identifiers or specific routes. This service can be utilized as a small SaaS solution for applications requiring rate limiting functionality.

## Features

- Health Check Endpoint
- Rate Limit Check Endpoint
- Custom Rate Limits for each Client ID or Route
- Utilizes Redis for efficient data storage and retrieval

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd gatekeeper-service
   ```

3. Install the dependencies:

   ```
   npm install
   ```

4. Ensure you have Redis installed and running on your machine.

## Usage

To start the server, run:

```
npm start
```

The server will be running on `http://localhost:3000` by default.

### API Endpoints

- **Health Check**

  - **GET /**: Returns a message indicating that "GateKeeper is running".

- **Rate Limit Check** (Requires API key)
  - **POST /check-limit**: Checks the rate limit for a client based on their ID or route.
  - **POST /set-limit**: Sets custom limits for a specific client ID or route.

### API Documentation

#### 1. Health Check

- **GET /**  
  **Response:**
  ```json
  { "message": "GateKeeper is running" }
  ```

#### 2. Rate Limit Check

- **POST /check-limit**  
  **Headers:**
  ```
  Authorization: your-generated-api-key
  ```
  **Body:**
  ```json
  {
    "clientId": "client123",
    "ip": "192.168.1.1",
    "route": "/api/resource"
  }
  ```
  **Response:**
  ```json
  {
    "allowed": true,
    "remaining": 9,
    "retryAfter": 0,
    "limit": 10,
    "window": 60
  }
  ```

#### 3. Set Custom Limit

- **POST /set-limit**  
  **Headers:**
  ```
  Authorization: your-generated-api-key
  ```
  **Body:**
  ```json
  {
    "clientId": "client123",
    "route": "/api/resource",
    "limit": 20,
    "window": 120
  }
  ```
  **Response:**
  ```json
  {
    "message": "Limit updated",
    "identifier": "client123:/api/resource",
    "limit": 20,
    "window": 120
  }
  ```

## Configuration

You can configure default rate limits and time windows in the `src/config/settings.js` file. The default values can be adjusted as needed.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
