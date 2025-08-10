# PenguinDB - Data Engineer Portfolio

[![Build Check](https://github.com/sanchitvj/data_engineer_portfolio/actions/workflows/build_check.yml/badge.svg)](https://github.com/sanchitvj/data_engineer_portfolio/actions/workflows/build_check.yml)

My portfolio website built with Next.js 14 and AWS, showcasing AI and data engineering projects.

**Visit [penguindb.me](https://penguindb.me)**

## Why I built this

Most portfolios are static websites with fancy animations. I wanted to build something that actually processes data in real time. 

The website runs on production AWS infrastructure. When you browse projects, you're hitting real DynamoDB tables. The resume section pulls live data from APIs I built. Even the QR code generator handles thousands of requests per second because I got tired of slow online tools.

I chose penguins as the theme because they're methodical and collaborative, like good data engineering should be. Plus, I spent way too much time perfecting penguin-themed loading animations.

The backend demonstrates how I approach data systems professionally: Lambda functions for content processing, SQS for reliable job queuing, and DynamoDB for fast reads. Everything is monitored, logged, and built to handle failure gracefully.

You can explore my sports analytics platform, see how I benchmark modern data tools, or try the document analysis system I built with vector databases. Each project includes the actual architecture diagrams and performance metrics.

Built with Next.js 14, TypeScript, AWS, and an unreasonable attention to detail.
