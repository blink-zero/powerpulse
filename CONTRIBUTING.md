# 🔌 Contributing to PowerPulse

Hey there! Thanks for checking out PowerPulse and considering contributing! This guide will help you get started with the project. Don't worry, we're pretty laid back here.


## What's Inside

- [The Basics](#the-basics)
- [Getting Your Environment Set Up](#getting-your-environment-set-up)
- [Making Changes](#making-changes)
- [Sending Your Changes Our Way](#sending-your-changes-our-way)
- [Coding Style](#coding-style)
- [Commit Messages](#commit-messages)
- [Testing Your Stuff](#testing-your-stuff)
- [Updating Docs](#updating-docs)

## The Basics

We have a [Code of Conduct](CODE_OF_CONDUCT.md) that boils down to "be nice to each other." Give it a quick read before jumping in.

## Getting Your Environment Set Up

1. Fork the repo (click that Fork button at the top right of the GitHub page)
2. Clone your fork to your computer:
   ```
   git clone https://github.com/YOUR-USERNAME/powerpulse.git
   cd powerpulse
   ```
3. Set up the original repo as "upstream" so you can stay up to date:
   ```
   git remote add upstream https://github.com/blink-zero/powerpulse.git
   ```
4. Install all the dependencies:
   ```
   npm run install-all
   ```
5. Create a branch for your awesome new feature:
   ```
   git checkout -b cool-new-feature
   ```

## Making Changes

1. Make sure you're working with the latest code:
   ```
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. Branch off for your changes:
   ```
   git checkout -b cool-new-feature
   ```
3. Make your changes - go wild!
4. Test things locally to make sure nothing broke
5. Commit your changes (see commit message tips below)
6. Push your branch to your fork:
   ```
   git push origin cool-new-feature
   ```
7. Head over to GitHub and create a Pull Request

## Sending Your Changes Our Way

When you're ready to submit a Pull Request (PR):

1. Give it a clear title and description
2. Mention any issues it fixes (like "Fixes #123")
3. We'll review it as soon as we can and might suggest some tweaks
4. Once everything looks good, we'll merge it in!

## Coding Style

We're not super strict, but try to match the existing style:

- Use meaningful names for variables and functions
- Comment your code when it's doing something tricky
- Keep functions focused on doing one thing well

For React stuff:
- Functional components with hooks are our jam
- Destructure your props
- Use async/await for async operations

For CSS:
- We're using Tailwind CSS
- For custom CSS, follow BEM naming if possible
- Keep it simple!

## Commit Messages

We loosely follow the [Conventional Commits](https://www.conventionalcommits.org/) style, but don't stress too much about it. The basic format is:

```
type: what you did
```

Common types are:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code changes that don't add features or fix bugs
- `test`: Adding or updating tests

## Testing Your Stuff

We have a comprehensive testing setup with Jest for the server and Vitest for the client:

### Client Testing
- Run client tests: `cd client && npm test`
- Watch mode: `cd client && npm run test:watch`
- Coverage report: `cd client && npm run test:coverage`

### Server Testing
- Run server tests: `cd server && npm test`
- Watch mode: `cd server && npm run test:watch`
- Coverage report: `cd server && npm run test:coverage`

### Writing Tests
- Client tests go in `client/src/test` or alongside components with `.test.jsx` extension
- Server tests go in `server/tests` with `.test.js` extension
- Focus on testing functionality, not implementation details
- Don't worry about 100% coverage - just test the important parts

## Linting

We use ESLint to maintain code quality:

- Lint client code: `cd client && npm run lint`
- Fix client code: `cd client && npm run lint:fix`
- Lint server code: `cd server && npm run lint`
- Fix server code: `cd server && npm run lint:fix`

## CI/CD Pipeline

We use GitHub Actions for our CI/CD pipeline:

- Every PR and push to main/develop branches triggers the pipeline
- The pipeline runs linting, tests, and builds the application
- All checks must pass before a PR can be merged
- Tagged releases are automatically built and prepared for deployment

When you submit a PR, check the GitHub Actions tab to see if your changes pass all checks.

## Updating Docs

If you're changing how something works:
- Update the README if needed
- Add JSDoc comments to functions if you can
- If you're changing an API, update the API.md file

That's it! Thanks for helping make PowerPulse better! 🎉
