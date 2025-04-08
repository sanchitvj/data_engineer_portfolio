# Data Engineer Portfolio Website

A modern, high-performance portfolio website built with Next.js 14 and AWS, showcasing data engineering projects and technical expertise.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: AWS (S3, Lambda, API Gateway, DynamoDB)
- **Content Management**: Sanity.io
- **Hosting**: AWS Amplify, CloudFront, Route 53

## Features

- 🚀 Projects showcase with interactive cards and detailed views
- 📊 Skills cloud system with filtering and visualization
- 📝 Dynamic resume with multiple format support
- ✍️ Technical blog with MDX support
- 🎨 Dark/light mode
- 📱 Fully responsive design
- 🔍 SEO optimized
- 🛡️ Security best practices
- 📈 Performance optimized

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
├── lib/             # Utility functions and configurations
├── styles/          # Global styles and Tailwind config
└── types/           # TypeScript type definitions
```

## Deployment

The project is configured for continuous deployment using AWS Amplify. Push to the main branch to trigger a deployment.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 