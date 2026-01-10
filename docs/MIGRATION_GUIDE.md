# Automated Supabase Migrations

This project is set up to allow automated migrations to the linked Supabase project.

## Setup

1.  Run the setup script to configure your credentials:
    ```bash
    npm run setup:db:auth
    ```
    You will need your **Supabase Access Token** and **Database Password**.
    - [Generate Access Token](https://supabase.com/dashboard/account/tokens)

2.  This will create/update your `.env` file with:
    - `SUPABASE_ACCESS_TOKEN`
    - `SUPABASE_DB_PASSWORD`

## Running Migrations

To apply local migrations to the remote Supabase project:

```bash
npm run migrate
```

This runs `scripts/migrate.sh`, which:
1.  Checks for the existence of `supabase` CLI.
2.  Loads credentials from `.env`.
3.  Runs `supabase db push`.

## Troubleshooting

-   **Auth Errors**: Ensure `SUPABASE_ACCESS_TOKEN` is valid and has permissions for the project.
-   **Password Errors**: Ensure `SUPABASE_DB_PASSWORD` is correct for the linked project `wftsctqfiqbdyllxwagi`.
