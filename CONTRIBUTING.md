# Contributing to Modulo CMS

Thank you for your interest in contributing to Modulo CMS! This document provides guidelines and information for contributors working with our Laravel 12 + React 19 starter kit foundation.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug Reports**: Report bugs and issues
- **Feature Requests**: Suggest new features
- **Code Contributions**: Submit pull requests
- **Documentation**: Improve or add documentation
- **Testing**: Write or improve tests
- **Design**: Help with UI/UX improvements

### Before You Start

1. **Check Existing Issues**: Search existing issues to avoid duplicates
2. **Read Documentation**: Familiarize yourself with the project structure
3. **Set Up Development Environment**: Follow the installation guide in README.md

## 🚀 Development Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/modulo-cms.git
cd modulo-cms

# Install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Set up database
touch database/database.sqlite
php artisan migrate

# Start development server
composer run dev
```

## 📝 Code Standards

### PHP (Laravel)
- Follow [PSR-12](https://www.php-fig.org/psr/psr-12/) coding standards
- Use Laravel conventions for naming and structure
- Follow Laravel Starter Kit patterns for authentication
- Write meaningful commit messages
- Add type hints where possible
- Use Laravel's built-in validation

### JavaScript/TypeScript (React)
- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful component names

### General Guidelines
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names
- Follow the existing code style

## 🧪 Testing

### Writing Tests
- Write tests for all new features
- Use Pest PHP for PHP tests
- Test both happy path and edge cases
- Mock external dependencies
- Aim for good test coverage

### Running Tests
```bash
# Run all tests
composer test

# Run specific test file
./vendor/bin/pest tests/Feature/MyFeatureTest.php

# Run with coverage
./vendor/bin/pest --coverage
```

## 🔄 Pull Request Process

### Before Submitting a PR

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write your code following the standards above
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   # Run tests
   composer test
   
   # Check code style
   composer run format
   npm run lint
   
   # Type checking
   npm run types
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Submitting the PR

1. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use the PR template
   - Describe your changes clearly
   - Link related issues
   - Add screenshots for UI changes

3. **PR Review Process**
   - Address review comments
   - Make requested changes
   - Ensure all checks pass

## 🐛 Bug Reports

### Before Reporting a Bug

1. Check if the issue has already been reported
2. Try to reproduce the issue
3. Check if it's a configuration issue

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
How would this feature be used?

**Proposed Solution**
Any ideas you have for implementation.

**Alternative Solutions**
Other ways to solve this problem.

**Additional Context**
Any other context or screenshots.
```

## 🏗 Plugin Development

### Creating a Plugin

1. **Plugin Structure**
   ```
   app/Plugins/MyPlugin/
   ├── Controllers/
   ├── Models/
   ├── Views/
   ├── Routes/
   ├── Migrations/
   ├── Config/
   └── Plugin.php
   ```

2. **Plugin Class**
   ```php
   <?php
   
   namespace App\Plugins\MyPlugin;
   
   class Plugin
   {
       public function register()
       {
           // Register routes, services, etc.
       }
   
       public function boot()
       {
           // Boot the plugin
       }
   }
   ```

### Plugin Guidelines
- Follow Laravel conventions
- Use namespacing to avoid conflicts
- Provide clear documentation
- Include tests for your plugin
- Make plugins configurable

## 📚 Documentation

### Writing Documentation
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up to date
- Use proper markdown formatting

### Documentation Structure
- README.md - Project overview
- CONTRIBUTING.md - This file
- docs/ - Detailed documentation
- API documentation
- Plugin development guide

## 🎨 UI/UX Contributions

### Design Guidelines
- Follow the existing design system
- Use Tailwind CSS classes
- Ensure accessibility (WCAG 2.1)
- Test on different screen sizes
- Use consistent spacing and typography

### Component Development
- Create reusable components
- Use Radix UI primitives
- Implement proper keyboard navigation
- Add proper ARIA labels
- Test with screen readers

## 🔒 Security

### Security Guidelines
- Never commit sensitive data
- Validate all user inputs
- Use Laravel's built-in security features
- Follow OWASP guidelines
- Report security issues privately

### Reporting Security Issues
If you find a security vulnerability, please report it privately to:
- Email: security@modulo-cms.com
- Do not create public issues for security problems

## 🏆 Recognition

### Contributors
- All contributors will be listed in the README
- Significant contributions will be highlighted
- Contributors will be added to the project's contributors list

### Types of Recognition
- Code contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Community support

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Email**: support@modulo-cms.com

### Before Asking for Help
1. Check the documentation
2. Search existing issues
3. Try to reproduce the problem
4. Provide clear, detailed information

## 📄 License

By contributing to Modulo CMS, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Modulo CMS! Your help makes this project better for everyone. 