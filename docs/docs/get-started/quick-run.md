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

Starting from version 2.0.0, sessions are managed using base64 strings. You can restore a session using any of these equivalent commands:

```bash
# Using --session-data (recommended)
npx @open-wa/wa-automate --session-data "YOUR_BASE64_SESSION_DATA"

# Using --session
npx @open-wa/wa-automate --session "YOUR_BASE64_SESSION_DATA"

# Using -s (shorthand)
npx @open-wa/wa-automate -s "YOUR_BASE64_SESSION_DATA"
```

:::note
Always wrap your session data string in double quotes (`""`), not single quotes.
:::

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

## Getting Help

View all available options and their descriptions:

```bash
npx @open-wa/wa-automate --help
```

## Postman Collection

A Postman collection is automatically generated for your specific setup, including API keys, hostname, ports, and more. You can easily import this collection into Postman for further testing and exploration.

## Coming Soon

SDKs for most programming languages will be created using the CLI as a base 'server'. Check this issue for updates: [#894](https://github.com/open-wa/wa-automate-nodejs/issues/894)
