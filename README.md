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

The archive page automatically updates whenever I publish content on LinkedIn, Substack, or YouTube. I got tired of manually copying content everywhere, so I built a pipeline that watches a Google Sheet, processes new entries through AWS Lambda functions, enhances them with AI, and updates the website in milliseconds. The whole system costs under $2 per month and saved me from boring copy-paste work.

![Content Automation Pipeline](public/pdb_content_arch.gif)

Read the full breakdown: [Content Automation Pipeline behind penguindb.me](https://sanchitvj.substack.com/p/content-automation-pipeline-behind?r=4mtvza)
