# Express Magento 2 OAuth Client
by Joseph Leedy

Express Magento 2 OAuth Client is a backend application that facilitates
communication with Magento Open Source or Adobe Commerce for the purpose of
requesting and storing an OAuth API token for an integration. It is intended 
to be used alongside the [React Product Viewer] frontend application.

**Note**: This application is provided as-is without warranty for fitness or
merchantability for any particular purpose. It is not intended for use in
production environments.

## Requirements

- [Node.js] version 18, 19, 20 or 21 (tested with version 20)
- [NPM] version 10
- [Adobe Commerce] or [Magento Open Source] version 2.4.5 or higher
(2.4.6-p3 recommended) _or_ [Mage-OS] 1.0.0 or higher
- [Redis] version 7 (tested with 7.2)

## Installation

1. Clone this project from the [GitHub repository][repo] using this command:

       git clone https://github.com/JosephLeedy/express-magento2-oauth.git
2. Install its dependencies with this command:

       cd express-magento2-oauth && npm install
3. Run this command to start the application in development mode:

       npm run dev
4. _Alternatively_, run these commands to start the application in production 
mode:

       npm run build
       npm start

**Note**: The above commands should be run a terminal window on the machine 
where you intend to install and run the application (e.g. your local computer 
or a remote server).

## Configuration

The following settings _must_ be configured in order for the application to 
function properly:

| Name                       | Default   | Description                                                                         |
|----------------------------|-----------|-------------------------------------------------------------------------------------|
| PORT                       | 3000      | Port to listen for requests on                                                      |
| REDIS_HOST                 | 127.0.0.1 | URL or IP address used for connecting to Redis                                      |
| REDIS_PORT                 | 6379      | Port to connect to Redis on (e.g. "6379")                                           |
| REDIS_DATABASE             | 0         | Number of the Redis database used to store application data                         |
| REDIS_USE_TLS              | false     | Whether or not to use a TLS certificate to securely connect to Redis                |
| REDIS_TLS_KEY_PATH         | ""        | Path to key for the configured TLS certificate (required if TLS is enabled)         |
| REDIS_TLS_CERTIFICATE_PATH | ""        | Path to the TLS certificate used to secure connections (required if TLS is enabled) |
| MAGENTO_BASE_URL           | ""        | Base URL of the connected Magento, Adobe Commerce or Mage-OS store                  |

### Optional Settings

| Name                          | Default | Description                                                        |
|-------------------------------|---------|--------------------------------------------------------------------|
| REDIS_SOCKET_PATH             | ""      | Path to the socket that Redis is listening for connections to      |
| REDIS_USERNAME                | ""      | Name of the Redis user to authenticate as                          |
| REDIS_PASSWORD                | ""      | Password of the Redis user to authenticate as                      |
| REDIS_TLS_CERT_AUTHORITY_PATH | ""      | Path to the TLS authority chain certificate (a.k.a "CA certificate |

Configuration can be set in `.env`, `.env.local`, `.env.development` or
`.env.production` depending on which environment you are configuring. More 
details about the configuration settings can be found in the `.env.dist` file.

## Usage

Once the application is configured and running, please follow these instructions
to set up a new integration in your Magento Open Source, Adobe Commerce or 
Mage-OS store:

1. Log into your store's Admin panel
2. Navigate to "System > Extensions > Integrations"
3. Click on the "Add New Integration" button
4. Configure the Integration Info as follows (replace "product-viewer.test" with
your _real_ domain name where this application is hosted):
    - Name: `Product Viewer`
    - Callback URL: `https://product-viewer.test/oauth/callback`
    - Identity Link URL: `https://product-viewer.test/oauth/identity`
5. Configure the API permissions as follows:
    - Resource Access: `Custom`
    - Resources: `Catalog > Inventory > Products`
6. Save the new integration, and then click on the "Authorize" link in the
"Activate" column
7. Ensure that the "Status" column changes to "Active"
8. If the integration fails to activate, check the terminal window that is
running this application for any errors that may have been output there
9. Once the integration has been successfully activated, this application can be
shut down by pressing the Control and C (CTRL+C) keys simultaneously in the
terminal window where it was started

## Support

This project is not intended for real-world usage, therefore no support is
offered at this time. If you think that have found a bug, however, or you'd like
to provide feedback or suggestions for improvement, please open a
[GitHub Issue][issues].

## License

This application is licensed under the MIT license. Please see [LICENSE] for
details.

## Changelog

A record of all changes made to this application can be found in the [Changelog]
document.

[React Product Viewer]: https://github.com/JosephLeedy/react-product-viewer
[Node.js]: https://nodejs.org
[NPM]: https://www.npmjs.com/package/npm
[Adobe Commerce]: https://business.adobe.com/products/magento/magento-commerce.html
[Magento Open Source]: https://business.adobe.com/products/magento/open-source.html
[Mage-OS]: https://mage-os.org
[Redis]: https://redis.io
[repo]: https://github.com/JosephLeedy/express-magento2-oauth
[issues]: https://github.com/JosephLeedy/express-magento2-oauth/issues
[LICENSE]: ./LICENSE
[Changelog]: ./CHANGELOG.md
