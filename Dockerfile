# Use Node.js v22.14.0 as the base image
FROM node:22.14.0-alpine AS builder

# Add this line
ARG PUBLIC_CHAT_ENDPOINT
# Then add env for build time
ENV PUBLIC_CHAT_ENDPOINT=${PUBLIC_CHAT_ENDPOINT}

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy the entire project
COPY . .

# Install dependencies with legacy peer deps to handle version conflicts
# (Handles the Svelte 5 vs Svelte 4 dependency conflict)
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm build

# Production stage
FROM node:22.14.0-alpine AS production

# Set working directory
WORKDIR /app

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app will run on
EXPOSE 3000

# Switch to non-root user
USER sveltekit

# Start the application
CMD ["node", "build"]
