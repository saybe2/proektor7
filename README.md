# Сайт тайм-кафе «ПРОЕКТОР» — proektor7.ru

Next.js 16 + Prisma + SQLite. Деплой — Docker.

Оценка бюджета разработки, запуска и ежемесячных расходов приведена в [`COSTS.md`](./COSTS.md).

## Запуск локально

```bash
npm install
npx prisma db push        # создать БД
node prisma/seed.js       # заполнить контент + аккаунты владельца/админа
npm run dev               # http://localhost:3000
```

## Вход (режим разработки)

`OTP_PROVIDER="mock"` в `.env` — код подтверждения печатается в консоль сервера.

- Владелец: телефон `+7 900 000-00-01` → `/owner`
- Админ: телефон `+7 900 000-00-02` → `/admin`
- Клиент: любой другой номер → регистрация, +150 бонусов

Номера служебных аккаунтов задаются через env `OWNER_PHONE` / `ADMIN_PHONE`
при запуске сида (или правкой `prisma/seed.js`).

## Что реализовано

- Регистрация/вход по номеру телефона (flash call через sms.ru или mock)
- Бонусы: 150 за регистрацию, кэшбэк 1%, оплата бонусами до 50% чека (чек от 500 ₽)
- Рефералка: своя ссылка/промокод, 3% от покупок друга
- Пуш-уведомления (web-push): рассылка от владельца + автопуши на ДР за 14/7/4 дня
- Касса для админа: поиск клиента, проведение чека, списание/корректировка бонусов
- Кабинет владельца: статистика, пуш-рассылка, редактор контента (комнаты с фото, меню, игры)
- SEO: мета-теги, Schema.org (CafeOrCoffeeShop), sitemap.xml, robots.txt, PWA-манифест

## Деплой в Docker (VPS)

### 1. Подготовка

```bash
git clone https://github.com/saybe2/proektor7.git
cd proektor7
cp .env.production.example .env.production
nano .env.production   # заполнить все "ЗАМЕНИТЬ"
```

Генерация секретов:

```bash
openssl rand -hex 32                  # AUTH_SECRET
openssl rand -hex 16                  # CRON_SECRET
npx web-push generate-vapid-keys     # VAPID-ключи
```

### 2. Первый запуск (с сидом)

Раскомментировать `RUN_SEED: "1"` в `docker-compose.yml`, затем:

```bash
export NEXT_PUBLIC_VAPID_PUBLIC_KEY="<публичный VAPID-ключ>"
OWNER_PHONE=79XXXXXXXXX ADMIN_PHONE=79XXXXXXXXX docker compose up -d --build
docker compose logs -f web   # проверить, что сид прошёл
```

После первого запуска закомментировать `RUN_SEED` обратно и перезапустить:

```bash
docker compose up -d
```

### 3. Обновление сайта

```bash
git pull
docker compose up -d --build
```

По умолчанию контейнер доступен на порту `3002`. Порт хоста можно изменить через `APP_PORT` в `.env.production`.

Данные не теряются: БД и загруженные фото лежат в Docker-вольюмах
(`proektor_db`, `proektor_uploads`).

### 4. HTTPS (nginx + certbot на хосте)

```nginx
server {
    server_name proektor7.ru www.proektor7.ru;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10m;   # загрузка фото комнат
    }
}
```

```bash
sudo certbot --nginx -d proektor7.ru -d www.proektor7.ru
```

ДР-пуши шлёт контейнер `cron` автоматически каждый день в 12:00.

### Бэкап БД

```bash
docker run --rm -v proektor7_proektor_db:/data -v $(pwd):/backup alpine \
  cp /data/prod.db /backup/backup-$(date +%F).db
```

## Настройка `.env.production`

| Переменная | Что вписать |
|---|---|
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `OTP_PROVIDER` | `smsru` (или `mock` для теста) |
| `SMSRU_API_ID` | ключ из кабинета sms.ru |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |
| `NEXT_PUBLIC_SITE_URL` | `https://proektor7.ru` |
| `CRON_SECRET` | случайная строка для защиты крона |

## Контент

Комнаты (с загрузкой фото), меню и игры редактируются владельцем
на сайте: `/owner/content`.
