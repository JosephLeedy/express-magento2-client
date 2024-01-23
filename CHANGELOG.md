# Changelog for Express Magento 2 API Client

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][kac], and this project adheres to
[Semantic Versioning][semver].

## [Unreleased]

### Added
- Requests for categories and products can now be passed through to the Magento 
API via special `catalog/*` endpoints
  - This functionality includes a new setting for the frontend application URL 
  which is used to prevent CORS errors
  - Data received from the Magento API is cached in Redis
    - A new setting is included for configuring the cache lifetime
- A Docker environment is now provided to aid in setting up and running the 
project
- GitHub meta files have been added to the repository

### Changed
- Project has been renamed to reflect increase in scope
- Logic for generating OAuth Authorization header has been refactored
- Code changes are now automatically linted and tested when they are pushed to 
the `main` branch or a pull request is submitted against that branch

### Fixed
- "Address is already in use" errors are no longer thrown when running tests if 
the application is already running in development mode
- Unit test for the index route no longer overwrites data stored in Redis
- Unit test for the router will attempt to pass up to three times before 
throwing an error
- Sort order for OAuth signature parameters now correctly includes query string 
parameters
- Query string parameters are now added to general OAuth parameters

## [1.0.0] - 2024-01-09

### Added
- Initial release of application

[kac]: https://keepachangelog.com/en/1.0.0/
[semver]: https://semver.org/spec/v2.0.0.html
[Unreleased]: https://github.com/JosephLeedy/express-magento2-client/compare/1.0.0...HEAD
[1.0.0]: https://github.com/JosephLeedy/express-magento2-client/releases/tag/1.0.0
