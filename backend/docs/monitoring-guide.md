# JayLink SMS Platform Monitoring Access Guide

This guide explains how to access the monitoring endpoints in your JayLink SMS Platform.

## Available Monitoring Endpoints

All monitoring endpoints require admin authentication to access. Below are the URL paths and descriptions for each endpoint:

### Basic Health Check

- **URL**: `http://localhost:3000/api/health`
- **Description**: Basic health check endpoint available to everyone
- **Authentication**: None required

### Extended Health Check

- **URL**: `http://localhost:3000/api/health/extended`
- **Description**: Provides more detailed health information for authenticated users
- **Authentication**: Basic user authentication

### Admin Monitoring Endpoints

All the following endpoints require admin privileges to access:

1. **System Health**
   - **URL**: `http://localhost:3000/api/admin/monitoring/health`
   - **Description**: Detailed current system health metrics
   - **Authentication**: Admin required

2. **Historical Metrics**
   - **URL**: `http://localhost:3000/api/admin/monitoring/history`
   - **Description**: Historical system metrics
   - **Authentication**: Admin required
   - **Query Parameters**: 
     - `limit`: Number of records to return (default: 24)
     - `offset`: Pagination offset (default: 0)

3. **Alert Thresholds**
   - **URL**: `http://localhost:3000/api/admin/monitoring/thresholds`
   - **Description**: View current alert threshold settings
   - **Authentication**: Admin required

4. **Backup Status**
   - **URL**: `http://localhost:3000/api/admin/monitoring/backups`
   - **Description**: View database backup status and history
   - **Authentication**: Admin required

5. **Run System Analysis**
   - **URL**: `http://localhost:3000/api/admin/monitoring/analyze`
   - **Method**: POST
   - **Description**: Trigger an immediate comprehensive system analysis
   - **Authentication**: Admin required

6. **Trigger Manual Backup**
   - **URL**: `http://localhost:3000/api/admin/monitoring/backups`
   - **Method**: POST
   - **Description**: Trigger a manual database backup
   - **Authentication**: Admin required

## Accessing Monitoring in Your Browser

### Step 1: Start the Server

Make sure your JayLink SMS Platform server is running:

```bash
npm run start
```

### Step 2: Login as Admin

You'll need to authenticate as an admin user to access the monitoring endpoints. You can do this by:

1. Using the admin login page at `http://localhost:8080/admin/login` (frontend app)
2. Obtaining a JWT token via the API at `http://localhost:3000/api/admin/auth/login`

### Step 3: Access the Monitoring Endpoints

#### Using the Admin Dashboard (Recommended)

The easiest way to access monitoring information is through the admin dashboard:

1. Login to the admin panel at `http://localhost:8080/admin`
2. Navigate to the "Monitoring" section in the sidebar
3. View the system health, metrics, and backup status in the UI

#### Using Direct API Access

If you prefer direct API access:

1. Log in to get a JWT token
2. Use a tool like Postman or browser extensions like "ModHeader" to set the Authorization header:
   ```
   Authorization: Bearer your_jwt_token_here
   ```
3. Navigate to any of the monitoring endpoints listed above

#### Example cURL Requests

```bash
# Get current system health
curl -X GET "http://localhost:3000/api/admin/monitoring/health" \
  -H "Authorization: Bearer your_jwt_token_here"

# Get historical metrics
curl -X GET "http://localhost:3000/api/admin/monitoring/history?limit=10&offset=0" \
  -H "Authorization: Bearer your_jwt_token_here"

# Trigger immediate system analysis
curl -X POST "http://localhost:3000/api/admin/monitoring/analyze" \
  -H "Authorization: Bearer your_jwt_token_here"
```

## Troubleshooting

If you encounter issues accessing the monitoring endpoints:

1. **Authentication Errors**: Make sure you're using a valid JWT token and it hasn't expired
2. **Authorization Errors**: Verify that your user account has admin privileges
3. **Server Errors**: Check the server logs for any issues with the monitoring system
4. **404 Not Found**: Ensure the server is running and you're using the correct URL paths

## Notes for Production Environments

In production environments, replace `localhost:3000` with your actual API domain and `localhost:8080` with your frontend domain.

For example:
- `https://api.yourdomain.com/api/admin/monitoring/health`
- `https://yourdomain.com/admin` (for the admin dashboard)