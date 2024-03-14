This is a frontend application for the [continousVulnScan PoC Backend](https://github.com/T4YR4N/continuousVulnScan).

It is developed using Next.js but in no way intended to be a production ready application. It complements the PoC backend and is intended to simplify the usage of the backend.

## How to start

1. Clone the repository
2. Create a `.env.local` file in the root directory and add the following content:
   ```env
   NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
   ```
   Replace the URL with the URL of your backend.
3. Run `docker compose up -d`

That's it. The application is now available at `http://localhost:3000`.
Every startup will take a moment after the container has started. Because Next.js has to build the application with the new environment variables.

## How to stop

Run `docker compose down`

## How to change the backend URL

1. Run `docker compose down`
2. Change the URL in the `.env.local` file
3. Run `docker compose up -d`
