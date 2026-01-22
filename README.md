# Modulo CMS

Modern, modular CMS built with Laravel 12 & React 19.

## 🚀 Quick Start

### PROD

```bash
# 1. Clone & Setup env
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.example .env.prod

# 2. Start with Docker (production)
./modulo.sh up prod
```

### DEV

```bash
# 1. Clone & Setup env
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.example .env.dev

# 2. Start with Docker (development)
./modulo.sh up dev
```

```

**Access:**
- Dashboard: [http://localhost:8080/dashboard](http://localhost:8080/dashboard)
- Frontend: [http://localhost:8080](http://localhost:8080)
- Mailpit (email testing): [http://localhost:8025](http://localhost:8025)

**Admin Credentials:**
- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## 🛠 Helper Script

Use `./modulo.sh` for common commands:

```bash
# Development (default)
./modulo.sh up dev          # Start services
./modulo.sh restart         # Restart dev
./modulo.sh logs dev        # Show logs
./modulo.sh shell dev       # Open shell
./modulo.sh artisan migrate:status dev
./modulo.sh migrate dev     # Run migrations
./modulo.sh seed dev        # Run seeders
./modulo.sh test dev        # Run tests
./modulo.sh status dev      # Show container status

# Production
./modulo.sh up prod
./modulo.sh logs prod

# Help
./modulo.sh help
```

---

## 📬 Contact Form Plugin

The Contact Form plugin adds a `[contact_form]` shortcode that stores submissions in the database and emails the configured admin address.

### Setup

1. Activate **Contact Form** in the admin plugin manager.
2. Run migrations for the submissions table:

```bash
./modulo.sh migrate dev
```

3. Set an admin recipient in **Site Settings → General → Admin Email** or via `MAIL_ADMIN_ADDRESS` in `.env.dev`.

### Shortcode Usage

```
[contact_form]
```

Optional default subject:

```
[contact_form subject="Support request"]
```

---

## 🛍 Shop Plugin

The Shop plugin provides e‑commerce functionality with products, orders, and email notifications.

### Features

- Product management (using Posts)
- Order processing
- Email notifications (customer & admin)
- Admin dashboard integration

### Email Notifications

Configure `MAIL_ADMIN_ADDRESS` in `.env.dev` to receive:
- New order notifications
- Customer order status updates

---

## 🐳 Docker Environments

| Environment | Config File | Use Case |
|-------------|-------------|----------|
| **Development** | `.env.dev` | Local development with Mailpit |
| **Production** | `.env.prod` | Production deployment (Redis, PostgreSQL, SMTP) |

### Development

```bash
./modulo.sh up dev
```

### Production

```bash
./modulo.sh up prod
```

---

## 🏗 Tech Stack
- **Backend:** PHP 8.4, Laravel 12
- **Frontend:** React 19, Inertia.js, Tailwind CSS 4
- **Database:** PostgreSQL 16
- **Tools:** Vite, Docker, Mailpit (dev), Redis (prod)

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.