---
title: Quick Start Guide - wa-automate EASY API
sidebar_label: Quick Start
sidebar_position: 0
description: A comprehensive guide to quickly set up wa-automate and create a Open-wa EASY API with zero installation requirements.
---

# Quick Start Guide

Want to create an API from your WA number in seconds? This guide will show you how!

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- Node.js
- npm (Node Package Manager)
- npx (Node Package Runner)

## Basic Usage

1. Open your terminal and run:

```bash
npx @open-wa/wa-automate
```

This command will:
- Start a @open-wa EASY API server
- Provide you with a URL to an interactive API explorer
- Generate documentation for all available endpoints

## Configuration Options

### Port Configuration
Set a custom port for your API server:

```bash
npx @open-wa/wa-automate -p 8080
```

### API Security
Protect your API with an authentication key:

```bash
# Auto-generate a secure key
npx @open-wa/wa-automate -p 8080 -k

# Use a custom key
npx @open-wa/wa-automate -p 8080 -k 'YOUR_SECURE_KEY'
```

:::note

[randomkeygen.com](https://randomkeygen.com/) is a great resource for generating secure keys. 

:::

### Tunneling
Your EASY API instance, by default, will be only accessible in your local network. This is useful and secure for local development but if you want to be able to access the API outside of your network you can do so easily with the `--tunnel` flag.

```bash
npx @open-wa/wa-automate -p 8080 -k 'YOUR_SECURE_KEY' --tunnel
```

:::note

You will might need to manually install  **cloudflared** for this to work.

:::

## Session Management

You may want to run multiple instances of the easy api for different host accounts. To enable this you will need to ensure that each session has a unique session ID and a seperate port.

```bash
# Using --session-data (recommended)
npx @open-wa/wa-automate --session-id sales --port 8081

# Using --session
npx @open-wa/wa-automate --session-id marketing --port 8082

```

## Server Deployment

When deploying to a remote server, specify your API hostname for proper documentation:

```bash
npx @open-wa/wa-automate -p 8080 --api-host 'https://your-api-domain.com:8080'
```

## Webhook Integration

Set up webhooks to receive real-time event notifications:

```bash
npx @open-wa/wa-automate -w 'https://your-webhook-url.com/endpoint'
```

:::tip Testing Webhooks

For testing webhooks, you can use services like [webhook.site](https://webhook.site/). Remember to clear your test data afterward for privacy!

:::

## API Documentation

The API documentation is automatically available at:
```
http://[your-host]/api-docs/
```

This interactive documentation includes:
- Complete endpoint listing
- Request/response examples
- Testing interface
- Authentication details

## Process Management with PM2

Starting from V4.35.0, you can manage your EASY API process using PM2. This provides several benefits:
- Automatic session recovery after restarts
- Memory usage management
- Process monitoring and logging
- Scheduled restarts

:::info Prerequisites
Make sure you have PM2 installed globally:
```bash
npm install -g pm2@latest
```
:::

### Basic PM2 Integration

Use the `--pm2` flag to offload your process to PM2:

```bash
npx @open-wa/wa-automate --pm2 --session-id STICKER-BOT
```

:::note
The process name is taken from the `--session-id` flag (default: `@OPEN-WA EASY API`). PM2 will not read the session ID from `cli.config.json`.
:::

To use a different PM2 process name while keeping your existing session ID:

```bash
npx @open-wa/wa-automate --pm2 --name STICKER-BOT
```

### Advanced PM2 Configuration

PM2 offers powerful process management features that you can utilize:

```bash
npx @open-wa/wa-automate --pm2 "--max-memory-restarts 300M --cron-restart=\"0 */3 * * *\" --restart-delay=3000" --name STICKER-BOT
```

This example:
- Restarts the process if memory exceeds 300MB
- Schedules restarts every 3 hours
- Adds a 3-second delay between restarts

:::warning
When using PM2 flags, do not use the `=` sign between the `--pm2` flag and its value. The following will NOT work:
```bash
npx @open-wa/wa-automate --pm2="--max-memory-restarts 300M"
```
:::

## Getting Help

View all available options and their descriptions:

```bash
npx @open-wa/wa-automate --help
```

## Postman Collection

A Postman collection is automatically generated for your specific setup, including API keys, hostname, ports, and more. You can easily import this collection into Postman for further testing and exploration.

## Coming Soon

SDKs for most programming languages will be created using the CLI as a base 'server'. Check this issue for updates: [#894](https://github.com/open-wa/wa-automate-nodejs/issues/894)
