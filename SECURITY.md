# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.8.x   | :white_check_mark: |
| 1.7.x   | :white_check_mark: |
| 1.6.x   | :white_check_mark: |
| < 1.6   | :x:                |

## Reporting a Vulnerability

We take the security of PowerPulse seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email the details to [INSERT SECURITY EMAIL]**
   - Provide a detailed description of the vulnerability
   - Include steps to reproduce the issue
   - Attach any proof-of-concept code or screenshots if applicable
   - If you have a suggested fix, please include it

## What to Expect

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide an initial assessment of the report within 5 business days
- We will keep you informed about our progress towards resolving the issue
- After the issue is resolved, we will publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous)

## Security Best Practices for Deployment

When deploying PowerPulse, please follow these security best practices:

1. **Use a Strong JWT Secret**
   - Generate a secure random string for your JWT_SECRET environment variable
   - Example: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Never use the default value in production

2. **Secure Your Environment Variables**
   - Keep your .env file secure and never commit it to version control
   - Restrict access to environment variables in production environments

3. **Use HTTPS in Production**
   - Always enable HTTPS for production deployments
   - Configure proper SSL certificates
   - Set the ENABLE_HTTPS environment variable to true

4. **Database Security**
   - Ensure your database files have proper permissions (640 for files, 750 for directories)
   - Back up your database regularly

5. **Regular Updates**
   - Keep your PowerPulse installation up to date with the latest security patches
   - Subscribe to release notifications

## Security Features

PowerPulse includes several security features:

- JWT-based authentication with 24-hour token expiration
- Role-based access control
- Automatic session timeout for inactive users
- Password hashing using bcrypt
- Input validation and sanitization
- Protection against common web vulnerabilities

## Third-Party Dependencies

PowerPulse relies on several third-party dependencies. We regularly update these dependencies to incorporate security fixes. If you discover a vulnerability in a third-party dependency, please report it to us as well as to the maintainers of the affected package.
