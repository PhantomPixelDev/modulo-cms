# Modulo CMS

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/PhantomPixelDev/modulo-cms/blob/main/LICENSE)
[![Laravel](https://img.shields.io/badge/Laravel-12.x-red.svg)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org)

Modulo CMS is a modern, modular content management system built on Laravel 12 with a React 19 frontend. It offers a flexible and extensible platform for creating websites with customizable content types, themes, and user permissions.

## Features

- **Dynamic Post Types**: Create and manage custom content types with configurable fields and templates.
- **Modular Theme System**: Easily switch between themes, customize layouts, and manage assets.
- **Taxonomy Management**: Organize content with hierarchical categories and tags.
- **Media Library**: Upload, manage, and organize media files in folders.
- **User & Role Management**: Fine-grained permission control for different user roles.
- **Sitemap Generation**: Automatic XML sitemap generation for SEO.
- **Rich Text Editor**: Built-in Slate editor for creating formatted content.

## Requirements

- PHP 8.4 or higher
- Composer
- Bun (for frontend asset compilation)
- Podman Compose or Docker Compose (for containerized development)
- SQLite (default) or MySQL/PostgreSQL

## Installation

### Using Podman Compose (Recommended for Development)

#### Quick Start (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/PhantomPixelDev/modulo-cms.git
   cd modulo-cms
   ```

2. Set up the environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure `DB_CONNECTION=sqlite` for a quick setup, or configure your preferred database.

3. Run the automated setup script:
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

4. Access the application at `http://localhost:8080` and the admin dashboard at `http://localhost:8080/dashboard`.
   - Default admin credentials: email `admin@example.com`, password `password`

#### Manual Setup (Alternative)

If you prefer manual control over the setup process:

1. Clone the repository:
   ```bash
   git clone https://github.com/PhantomPixelDev/modulo-cms.git
   cd modulo-cms
   ```

2. Set up the environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure `DB_CONNECTION=sqlite` for a quick setup, or configure your preferred database.

3. Start the development environment:
   ```bash
   podman compose -f docker/docker-compose.yml up -d --build
   ```

4. Generate application key:
   ```bash
   podman compose -f docker/docker-compose.yml exec app php artisan key:generate
   ```

5. Run migrations and seed the database:
   ```bash
   podman compose -f docker/docker-compose.yml exec app php artisan migrate --seed
   ```

6. Access the application at `http://localhost:8080` and the admin dashboard at `http://localhost:8080/dashboard`.
   - Default admin credentials: email `admin@example.com`, password `password`

## Usage

- **Admin Dashboard**: Access at `/dashboard` to manage content, users, themes, and settings.
- **Creating Content**: Use the intuitive interface to create posts, pages, and custom content types.
- **Theme Customization**: Install and customize themes from the admin panel.
- **Extending Functionality**: Follow the [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) to create custom plugins.

## Project Structure

- `app/`: Laravel application code (models, controllers, policies, etc.)
- `resources/js/`: React frontend codebase for the dashboard
- `resources/themes/`: Theme files and assets
- `public/`: Publicly accessible files and compiled assets
- `routes/`: API and web routes for frontend and backend
- `database/`: Migrations, factories, and seeders
- `docker/`: Configuration files for containerized development

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository or contact the maintainers.