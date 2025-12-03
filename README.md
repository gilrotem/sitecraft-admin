# SiteCraft CMS - Admin Panel

## Project Info

**Production URL**: https://sitecraft-admin.onrender.com  
**Repository**: https://github.com/gilrotem/sitecraft-admin  
**Backend**: Supabase (Your Instance)

## Development Workflow

**This project is under full control - no external integrations.**

### Local Development

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bb7f6763-9a89-4c86-a911-b7556a1dcdc6) and click on Share -> Publish.


## Deployment

**Automatic deployment to Render:**
- Push to `main` branch triggers auto-deploy
- Environment variables configured in Render Dashboard
- Live at: https://sitecraft-admin.onrender.com

## Custom Domain

Configure custom domain in Render Dashboard under Settings → Custom Domains.
