<div align="center">

# Sayless Frontend

**Next.js frontend for the Sayless anonymous feedback platform**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## About

Sayless is a Next.js frontend for an anonymous feedback platform. Users can submit feedback without revealing their identity. Built with real-time WebSocket communication and a clean, responsive interface.

## Features

- **Anonymous** — Submit feedback without registration or identity
- **Real-time** — Instant updates via WebSocket
- **Privacy** — Minimal data retention, no tracking
- **Modern UI** — Clean, responsive interface with Tailwind CSS
- **Docker** — Containerized deployment
- **Railway** — Ready for cloud deployment
- **Tested** — Jest test suite included

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript |
| Real-time | Socket.io / WebSocket |
| Styling | Tailwind CSS |
| Testing | Jest |
| Deploy | Docker, Railway |

## Getting Started

```bash
git clone https://github.com/foxnaim/Anonymous-chat.git
cd Anonymous-chat
yarn install
yarn dev
```

### Docker

```bash
docker-compose up
```

## License

MIT © [foxnaim](https://github.com/foxnaim)
